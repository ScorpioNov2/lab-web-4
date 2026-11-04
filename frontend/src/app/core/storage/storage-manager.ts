import { Injectable } from '@angular/core';
import type { AuthResponse } from '../auth/auth.model';
import { CookieStorageDriver, LocalStorageDriver, StorageDriver } from './storage-drivers';

/** Centralised definition of all storage keys. */
export const STORAGE_KEYS = {
	/** The package containing the accessToken, refreshToken, user... */
	AUTH_DATA: 'auth_secure_session',
	APP_THEME: 'user_theme_preference',
} as const;

/**
 * Two separate channels:
 *  - secure: cookie-based, holds the auth session
 *  - public: LocalStorage-based, holds general preferences
 */
@Injectable({ providedIn: 'root' })
export class StorageManager {
	private readonly secureStorage: StorageDriver = new CookieStorageDriver();
	private readonly publicStorage: StorageDriver = new LocalStorageDriver();

	// ---- secure layer (cookie-only) ----
	saveAuthSession(session: AuthResponse | null | undefined): void {
		if (!session) return;
		this.secureStorage.set(STORAGE_KEYS.AUTH_DATA, JSON.stringify(session));
	}

	getAuthSession(): AuthResponse | null {
		const rawJson = this.secureStorage.get(STORAGE_KEYS.AUTH_DATA);
		if (!rawJson) return null;
		try {
			return JSON.parse(rawJson) as AuthResponse;
		} catch {
			this.clearAuth();
			return null;
		}
	}

	getAccessToken(): string | null {
		return this.getAuthSession()?.accessToken || null;
	}

	clearAuth(): void {
		this.secureStorage.remove(STORAGE_KEYS.AUTH_DATA);
	}

	// ---- general layer (LocalStorage-only) ----
	saveTheme(themeName: string): void {
		this.publicStorage.set(STORAGE_KEYS.APP_THEME, themeName);
	}

	getTheme(): string {
		return this.publicStorage.get(STORAGE_KEYS.APP_THEME) || 'light';
	}
}
