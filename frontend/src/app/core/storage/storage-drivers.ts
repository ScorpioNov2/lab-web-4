export interface StorageDriver {
	get(key: string): string | null;
	set(key: string, value: string): void;
	remove(key: string): void;
}

const COOKIE_LIFETIME_DAYS = 7;

/** Cookie db */
export class CookieStorageDriver implements StorageDriver {
	get(key: string): string | null {
		const prefix = `${key}=`;
		for (const part of document.cookie.split(';')) {
			const cookie = part.trim();
			if (cookie.startsWith(prefix)) {
				return decodeURIComponent(cookie.substring(prefix.length));
			}
		}
		return null;
	}

	set(key: string, value: string): void {
		const expires = new Date(Date.now() + COOKIE_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
		document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
	}

	/** A cookie is deleted by giving it an expiry date in the past (same path as in set()). */
	remove(key: string): void {
		document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
	}
}

/** LocalStorage db */
export class LocalStorageDriver implements StorageDriver {
	get(key: string): string | null {
		return localStorage.getItem(key);
	}

	set(key: string, value: string): void {
		localStorage.setItem(key, value);
	}

	remove(key: string): void {
		localStorage.removeItem(key);
	}
}
