import { TestBed } from '@angular/core/testing';
import { ThemeFrame } from './theme-frame';

describe('ThemeFrame', () => {
	afterEach(() => document.documentElement.removeAttribute('data-theme'));

	function render(theme: string | null) {
		if (theme) document.documentElement.setAttribute('data-theme', theme);
		const fixture = TestBed.createComponent(ThemeFrame);
		fixture.detectChanges();
		const root: HTMLElement = fixture.nativeElement;
		return (selector: string) => root.querySelectorAll(selector).length;
	}

	it('draws corners, edges and ornament slots of the halloween theme', () => {
		const count = render('halloween');
		expect(count('.frame-corner')).toBe(4);
		expect(count('.frame-corner-top-left')).toBe(1);
		expect(count('.frame-line-border')).toBe(4);
		expect(count('.border-bottom')).toBe(1);
		expect(count('.frame-decor-slot')).toBe(14);
		expect(count('.slot-top-1')).toBe(1);
	});

	it('draws nothing for a theme without decorations', () => {
		expect(render(null)('div')).toBe(0);
	});
});
