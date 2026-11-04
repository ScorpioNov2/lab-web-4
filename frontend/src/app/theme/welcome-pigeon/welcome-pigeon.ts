import { DOCUMENT } from '@angular/common';
import {
	afterNextRender,
	Component,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	Injector,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { ThemeService } from '../theme.service';
import { FlightRequest, WelcomePigeonService } from './welcome-pigeon.service';

interface Flight extends FlightRequest {
	/** the theme's picture tows the sign instead of the pigeon */
	useThemeImage: boolean;
	/** prefers-reduced-motion: no flying, the sign just fades in and out at the top centre */
	isStatic: boolean;
	/** hidden until the flight is measured and started */
	flying: boolean;
	seconds: number;
	from: number;
	to: number;
}

const FLIGHT_SPEED_PX_PER_SECOND = 280;
const MIN_FLIGHT_SECONDS = 6;
const STATIC_DISPLAY_SECONDS = 4.5; // used instead of the flight when the user prefers reduced motion
const THEME_IMAGE_TIMEOUT_MS = 3000; // a theme picture that takes longer than this to load is skipped

/**
 * Welcome flyer. After a successful login a pigeon flies along the top edge of the screen, from
 * left to right. It holds a rope in its beak and a sign hangs from that rope:
 *     "Welcome <full name> to the system"
 * The pigeon is drawn with inline SVG + CSS, no image assets needed.
 *
 * EVENT THEMES can swap the pigeon for a picture (e.g. the Halloween witch): the theme sets
 * --welcome-flyer-image (+ size/anchor variables, see src/styles/themes/_halloween.scss); when
 * that variable is present and the file loads, the picture tows the sign instead. If the file
 * cannot be loaded the pigeon flies as usual.
 *
 * Start it with WelcomePigeonService.fly(name).
 */
@Component({
	selector: 'app-welcome-pigeon',
	templateUrl: './welcome-pigeon.html',
	styleUrl: './welcome-pigeon.scss',
})
export class WelcomePigeon {
	private readonly service = inject(WelcomePigeonService);
	private readonly theme = inject(ThemeService);
	private readonly document = inject(DOCUMENT);
	private readonly injector = inject(Injector);

	private readonly flyerElement = viewChild<ElementRef<HTMLElement>>('flyer');

	/** Zero or one flight. A list so that `track id` rebuilds the element and restarts the animation. */
	protected readonly flights = signal<Flight[]>([]);

	private fallbackTimer: ReturnType<typeof setTimeout> | undefined;
	/** theme css value -> is the picture loadable? */
	private readonly themeImageChecks = new Map<string, Promise<boolean>>();

	constructor() {
		effect(() => {
			const request = this.service.request();
			untracked(() => this.begin(request));
		});
		inject(DestroyRef).onDestroy(() => clearTimeout(this.fallbackTimer));
	}

	protected onAnimationEnd(event: AnimationEvent): void {
		// Animations of the inner parts (bobbing, wings) bubble up too: only the flight itself counts.
		if (event.target === event.currentTarget) this.service.stop();
	}

	/** Let the pigeon (or the theme's picture) fly across the screen. A flight that is still running is replaced. */
	private begin(request: FlightRequest | null): void {
		this.clear();
		if (!request) return;

		const themeImage = this.theme.cssVariable('--welcome-flyer-image');
		if (!themeImage || themeImage === 'none') {
			this.prepare(request, false);
			return;
		}

		void this.checkThemeImage(themeImage).then((loadable) => {
			// replaced or stopped while the picture was loading
			if (this.service.request()?.id !== request.id) return;
			this.prepare(request, loadable);
		});
	}

	/** Puts the flyer into the DOM (hidden but laid out), then measures it and starts the flight. */
	private prepare(request: FlightRequest, useThemeImage: boolean): void {
		const isStatic =
			this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ??
			false;

		this.flights.set([
			{
				...request,
				useThemeImage,
				isStatic,
				flying: false,
				seconds: STATIC_DISPLAY_SECONDS,
				from: 0,
				to: 0,
			},
		]);
		afterNextRender(() => this.launch(request.id), { injector: this.injector });
	}

	private launch(id: number): void {
		const flyer = this.flyerElement()?.nativeElement;
		const flight = this.flights()[0];
		if (!flyer || !flight || flight.id !== id) return;

		let seconds = STATIC_DISPLAY_SECONDS;
		let from = 0;
		let to = 0;
		if (!flight.isStatic) {
			const flyerWidth = flyer.offsetWidth;
			const viewportWidth = this.document.defaultView?.innerWidth ?? 0;
			seconds = Math.max(
				MIN_FLIGHT_SECONDS,
				(viewportWidth + flyerWidth) / FLIGHT_SPEED_PX_PER_SECOND,
			);
			from = -flyerWidth;
			to = viewportWidth;
		}

		this.flights.set([{ ...flight, flying: true, seconds, from, to }]);
		// Safety net in case the animationend event never arrives (e.g. background tab).
		this.fallbackTimer = setTimeout(() => this.service.stop(), (seconds + 1) * 1000);
	}

	private clear(): void {
		clearTimeout(this.fallbackTimer);
		this.fallbackTimer = undefined;
		this.flights.set([]);
	}

	/**
	 * Can the theme's picture be loaded? The URL is resolved by the browser itself through the same
	 * CSS variable the flyer paints with. Loading it up front also means the picture is ready the
	 * moment the flight starts.
	 */
	private checkThemeImage(themeImage: string): Promise<boolean> {
		let check = this.themeImageChecks.get(themeImage);
		if (!check) {
			check = new Promise<boolean>((resolve) => {
				const probe = this.document.createElement('div');
				probe.style.cssText =
					'position:fixed;left:-9999px;top:0;width:1px;height:1px;visibility:hidden;background-image:var(--welcome-flyer-image)';
				this.document.body.appendChild(probe);
				const backgroundImage =
					this.document.defaultView?.getComputedStyle(probe).backgroundImage ?? '';
				const resolvedUrl = /url\(\s*["']?(.*?)["']?\s*\)/.exec(backgroundImage)?.[1];
				probe.remove();
				if (!resolvedUrl) return resolve(false);

				const image = new Image();
				const timer = setTimeout(() => resolve(false), THEME_IMAGE_TIMEOUT_MS);
				image.onload = () => {
					clearTimeout(timer);
					resolve(true);
				};
				image.onerror = () => {
					clearTimeout(timer);
					console.warn(
						`[WelcomePigeon] Cannot load the theme's flyer picture (${resolvedUrl}), using the pigeon instead.`,
					);
					resolve(false);
				};
				image.src = resolvedUrl;
			});
			this.themeImageChecks.set(themeImage, check);
		}

		// A failure may be a hiccup: do not remember it, the next login tries the picture again.
		void check.then((loadable) => {
			if (!loadable) this.themeImageChecks.delete(themeImage);
		});
		return check;
	}
}
