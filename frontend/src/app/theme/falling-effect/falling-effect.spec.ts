import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../theme.service';
import { FallingEffect } from './falling-effect';

describe('FallingEffect', () => {
	let cssVariables: Record<string, string>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(Math, 'random').mockReturnValue(0.5); // fall 6.5 s after a 2 s delay
		cssVariables = { '--has-falling-effect': 'true', '--theme-falling-item-count': '7' };
		TestBed.configureTestingModule({
			providers: [
				{
					provide: ThemeService,
					useValue: { cssVariable: (name: string) => cssVariables[name] ?? '' },
				},
			],
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	const items = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('.falling-item');

	it('spawns items while the theme has the effect, capped at 25', () => {
		const fixture = TestBed.createComponent(FallingEffect);
		const root: HTMLElement = fixture.nativeElement;

		vi.advanceTimersByTime(350);
		fixture.detectChanges();
		expect(items(root)).toHaveLength(1);
		expect(items(root)[0].dataset['index']).toBe('4'); // floor(0.5 * 6) + 1
		expect(items(root)[0].style.animationDelay).toBe('2s, 0s');

		vi.advanceTimersByTime(350 * 60);
		fixture.detectChanges();
		expect(items(root).length).toBeLessThanOrEqual(25);
	});

	it('lands an item, lets it lie there, fades it out and removes it', () => {
		const fixture = TestBed.createComponent(FallingEffect);
		const root: HTMLElement = fixture.nativeElement;

		vi.advanceTimersByTime(350);
		cssVariables['--has-falling-effect'] = 'false'; // no further items: follow just the first one
		fixture.detectChanges();
		expect(items(root)).toHaveLength(1);

		vi.advanceTimersByTime(8500); // delay 2 s + fall 6.5 s
		fixture.detectChanges();
		expect(items(root)[0].classList.contains('landed')).toBe(true);
		expect(items(root)[0].style.transform).toBe('rotate(180deg)');

		vi.advanceTimersByTime(4000);
		fixture.detectChanges();
		expect(items(root)[0].style.opacity).toBe('0');

		vi.advanceTimersByTime(1000);
		fixture.detectChanges();
		expect(items(root)).toHaveLength(0);
	});

	it('spawns nothing when the theme has no falling effect', () => {
		cssVariables['--has-falling-effect'] = '';
		const fixture = TestBed.createComponent(FallingEffect);
		vi.advanceTimersByTime(5000);
		fixture.detectChanges();
		expect(items(fixture.nativeElement)).toHaveLength(0);
	});

	it('stops all timers when destroyed', () => {
		const fixture = TestBed.createComponent(FallingEffect);
		vi.advanceTimersByTime(1000);
		expect(vi.getTimerCount()).toBeGreaterThan(0);

		fixture.destroy();
		expect(vi.getTimerCount()).toBe(0);
	});
});
