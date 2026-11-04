import { InjectionToken } from '@angular/core';

/** The single place where the backend address is declared (was BASE_URL in httpClient.js). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
	providedIn: 'root',
	factory: () => 'http://localhost:8080/api',
});
