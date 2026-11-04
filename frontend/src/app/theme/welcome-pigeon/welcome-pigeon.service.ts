import { Injectable, signal } from '@angular/core';

const MAX_NAME_LENGTH = 50;

/**
 * Name shown on the sign: whitespace is tidied up and it is capped at 50 characters
 * (counted as real characters, so Cyrillic/emoji are not cut in half). When it has to
 * be shortened the last character becomes "…", so the result is still 50 at most.
 */
export function formatName(fullName: string | null | undefined): string {
	const characters = Array.from(
		String(fullName ?? '')
			.replace(/\s+/g, ' ')
			.trim(),
	);
	if (characters.length <= MAX_NAME_LENGTH) return characters.join('');
	return characters.slice(0, MAX_NAME_LENGTH - 1).join('') + '…';
}

export interface FlightRequest {
	id: number;
	name: string;
}

/** Entry point to start the welcome flight from anywhere; <app-welcome-pigeon> plays it. */
@Injectable({ providedIn: 'root' })
export class WelcomePigeonService {
	/** The flight to play, or null. Every fly() produces a new id, so a running flight is replaced. */
	readonly request = signal<FlightRequest | null>(null);
	private nextId = 0;

	fly(fullName: string | null | undefined): void {
		this.request.set({ id: ++this.nextId, name: formatName(fullName) });
	}

	stop(): void {
		this.request.set(null);
	}
}
