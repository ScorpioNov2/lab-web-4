import { Component, input, output } from '@angular/core';

/**
 * The window chrome shared by every popup: dark overlay, header with title and close button,
 * scrollable body and a footer for the action buttons.
 *
 *   <app-modal-shell title="..." (closed)="...">
 *     body content
 *     <ng-container ngProjectAs="[modal-footer]"> buttons </ng-container>
 *   </app-modal-shell>
 */
@Component({
	selector: 'app-modal-shell',
	templateUrl: './modal-shell.html',
	styleUrl: './modal-shell.scss',
})
export class ModalShell {
	readonly title = input.required<string>();
	/** Shows the "×" button and allows closing by clicking the overlay. */
	readonly closable = input(true);
	/** A popup that opens on top of another one (e.g. the delete confirmation). */
	readonly nested = input(false);

	readonly closed = output<void>();

	protected onOverlayClick(event: MouseEvent): void {
		// Only a click on the overlay itself counts, not one that bubbled up from the window.
		if (this.closable() && event.target === event.currentTarget) {
			this.closed.emit();
		}
	}
}
