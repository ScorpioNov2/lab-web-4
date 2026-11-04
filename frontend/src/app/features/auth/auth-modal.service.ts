import { Injectable, signal } from '@angular/core';

export type AuthModalMode = 'login' | 'register';

/** Open/close state of the login/register popup, so the header and the table can open it. */
@Injectable({ providedIn: 'root' })
export class AuthModalService {
	/** null = closed */
	readonly mode = signal<AuthModalMode | null>(null);

	open(mode: AuthModalMode): void {
		this.mode.set(mode);
	}

	close(): void {
		this.mode.set(null);
	}
}
