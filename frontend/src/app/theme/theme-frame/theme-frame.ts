import { Component, inject } from '@angular/core';
import { ThemeService } from '../theme.service';

/** Decorative frame (corners, edges, ornament slots) of the active theme. */
@Component({
	selector: 'app-theme-frame',
	templateUrl: './theme-frame.html',
	styleUrl: './theme-frame.scss',
})
export class ThemeFrame {
	protected readonly theme = inject(ThemeService);
}
