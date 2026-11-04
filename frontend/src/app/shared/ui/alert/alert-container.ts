import { Component, inject } from '@angular/core';
import { AlertService } from './alert.service';

/** Fixed container in the top-right corner that renders the toasts of AlertService. */
@Component({
	selector: 'app-alert-container',
	templateUrl: './alert-container.html',
	styleUrl: './alert-container.scss',
})
export class AlertContainer {
	protected readonly alerts = inject(AlertService);
}
