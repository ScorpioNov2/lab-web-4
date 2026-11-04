import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: AlertType;
	/** true while the fade-out animation plays, right before the toast is removed */
	leaving: boolean;
}

const DEFAULT_DURATION_MS = 4000;
/** Must match the toastFadeOut animation length in alert-container.scss */
const FADE_OUT_MS = 300;

/** Toast notifications (was AlertManager). Rendered by <app-alert-container>. */
@Injectable({ providedIn: 'root' })
export class AlertService {
	readonly toasts = signal<Toast[]>([]);
	private nextId = 0;

	show(message: string, type: AlertType = 'info', duration = DEFAULT_DURATION_MS): void {
		const id = ++this.nextId;
		this.toasts.update((toasts) => [...toasts, { id, message, type, leaving: false }]);
		setTimeout(() => this.dismiss(id), duration);
	}

	success(message: string): void {
		this.show(message, 'success');
	}

	error(message: string): void {
		this.show(message, 'error');
	}

	info(message: string): void {
		this.show(message, 'info');
	}

	dismiss(id: number): void {
		const toast = this.toasts().find((candidate) => candidate.id === id);
		if (!toast || toast.leaving) return;

		this.toasts.update((toasts) =>
			toasts.map((candidate) =>
				candidate.id === id ? { ...candidate, leaving: true } : candidate,
			),
		);
		// Wait for the CSS fade-out animation to finish before removing the toast from the DOM.
		setTimeout(
			() => this.toasts.update((toasts) => toasts.filter((candidate) => candidate.id !== id)),
			FADE_OUT_MS,
		);
	}
}
