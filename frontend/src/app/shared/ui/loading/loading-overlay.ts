import { Component, inject } from '@angular/core';
import { LoadingService } from './loading.service';

/** Full-screen overlay spinner bound to LoadingService. */
@Component({
	selector: 'app-loading-overlay',
	templateUrl: './loading-overlay.html',
	styleUrl: './loading-overlay.scss',
})
export class LoadingOverlay {
	protected readonly loading = inject(LoadingService);
}
