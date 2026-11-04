import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AuthModalMode, AuthModalService } from '../../features/auth/auth-modal.service';
import { AlertService } from '../../shared/ui/alert/alert.service';

/** Top bar: title and the login / registration / logout buttons. */
@Component({
	selector: 'app-header',
	templateUrl: './header.html',
	styleUrl: './header.scss',
})
export class Header {
	protected readonly auth = inject(AuthService);
	private readonly authModal = inject(AuthModalService);
	private readonly alert = inject(AlertService);

	protected openAuth(mode: AuthModalMode, event: Event): void {
		// Do not let the click reach the document: it would drop the table row selection.
		event.stopPropagation();
		this.authModal.open(mode);
	}

	protected logout(): void {
		this.auth.logout();
		this.alert.info('Вы вышли из системы.');
	}
}
