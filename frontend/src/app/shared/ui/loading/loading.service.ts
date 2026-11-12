import { computed, Injectable, signal } from '@angular/core';

/** Global loading state manager supporting concurrent requests. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
	private readonly activeCount = signal(0);

	/** True when at least one loading task is in progress. */
	readonly isLoading = computed(() => this.activeCount() > 0);

	show(): void {
		this.activeCount.update((count) => count + 1);
	}

	hide(): void {
		this.activeCount.update((count) => Math.max(0, count - 1));
	}

	reset(): void {
		this.activeCount.set(0);
	}
}
