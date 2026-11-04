import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { THEME_DECORATIONS } from './theme-decorations';

/**
 * Read access to the active event theme. The theme is chosen by the `data-theme` attribute of
 * <html> (see index.html) and configured by CSS variables (see src/styles/themes/).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
	private readonly document = inject(DOCUMENT);

	readonly name = signal(this.document.documentElement.getAttribute('data-theme') || 'default');
	readonly decorations = computed(() => THEME_DECORATIONS[this.name()] ?? null);

	/** Value of a CSS custom property on <html>, e.g. cssVariable('--has-falling-effect'). */
	cssVariable(property: string): string {
		const view = this.document.defaultView;
		return view
			? view.getComputedStyle(this.document.documentElement).getPropertyValue(property).trim()
			: '';
	}
}
