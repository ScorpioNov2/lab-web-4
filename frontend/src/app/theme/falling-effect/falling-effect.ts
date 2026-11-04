import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ThemeService } from '../theme.service';

interface FallingItem {
	id: number;
	/** which of the theme's sprites (1..n-1) */
	index: number;
	/** % from the left edge */
	left: number;
	/** px */
	size: number;
	animationDuration: string;
	animationDelay: string;
	/** reached the ground: switches to the last sprite and freezes */
	landed: boolean;
	rotation: number;
	/** fading out, right before removal */
	fading: boolean;
}

const MAX_ITEMS = 25;
const SPAWN_INTERVAL_MS = 350;
const LANDED_VISIBLE_MS = 4000;
const FADE_OUT_MS = 1000;

/**
 * Objects (leaves, snowflakes...) falling over the page. Active only when the theme sets
 * `--has-falling-effect: true`; the sprites come from `--falling-item-img-N` (was startFallingEffect).
 */
@Component({
	selector: 'app-falling-effect',
	templateUrl: './falling-effect.html',
	styleUrl: './falling-effect.scss',
})
export class FallingEffect {
	private readonly theme = inject(ThemeService);

	protected readonly items = signal<FallingItem[]>([]);

	private nextId = 0;
	private readonly timers = new Set<ReturnType<typeof setTimeout>>();

	constructor() {
		const spawnTimer = setInterval(() => this.spawnItem(), SPAWN_INTERVAL_MS);
		inject(DestroyRef).onDestroy(() => {
			clearInterval(spawnTimer);
			this.timers.forEach(clearTimeout);
		});
	}

	private spawnItem(): void {
		if (this.theme.cssVariable('--has-falling-effect') !== 'true') return;
		if (this.items().length >= MAX_ITEMS) return;

		// The last sprite is the "ground" one, so the falling ones are randomised from 1 to n-1.
		const spriteCount = parseInt(this.theme.cssVariable('--theme-falling-item-count')) || 7;
		const fallingTypes = spriteCount > 1 ? spriteCount - 1 : 1;

		const duration = Math.random() * 5 + 4; // free-fall time (s)
		const delay = Math.random() * 4;
		const id = ++this.nextId;

		this.items.update((items) => [
			...items,
			{
				id,
				index: Math.floor(Math.random() * fallingTypes) + 1,
				left: Math.random() * 100,
				size: Math.random() * 20 + 20,
				animationDuration: `${duration}s, ${Math.random() * 3 + 2}s`,
				animationDelay: `${delay}s, 0s`,
				landed: false,
				rotation: 0,
				fading: false,
			},
		]);

		// Stage 1: wait for the whole life of the fall (spawn delay + fall time), then it lands.
		this.later((delay + duration) * 1000, () => {
			this.patch(id, { landed: true, rotation: Math.random() * 360 });

			// Stage 2: it lies there for 4 s, then fades out (1 s) and is removed.
			this.later(LANDED_VISIBLE_MS, () => {
				this.patch(id, { fading: true });
				this.later(FADE_OUT_MS, () =>
					this.items.update((items) => items.filter((item) => item.id !== id)),
				);
			});
		});
	}

	private patch(id: number, changes: Partial<FallingItem>): void {
		this.items.update((items) =>
			items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
		);
	}

	private later(delayMs: number, action: () => void): void {
		const timer = setTimeout(() => {
			this.timers.delete(timer);
			action();
		}, delayMs);
		this.timers.add(timer);
	}
}
