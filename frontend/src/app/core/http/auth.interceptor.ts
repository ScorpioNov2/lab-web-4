import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { API_BASE_URL } from '../config/api-base-url';
import { StorageManager } from '../storage/storage-manager';
import { toApiError } from './api-error';

/**
 * Replaces the request() core of the old httpClient.js:
 *  - attaches `Authorization: Bearer ...` to every API call except /auth/*
 *  - on a 401 for a request that carried a token: refreshes the token pair (shared between all
 *    concurrent requests) and replays the request EXACTLY ONCE
 *  - turns every failure into an ApiError(message, status)
 *
 * /auth/* is skipped on purpose: the backend (JwtAuthenticationFilter) answers 401 to ANY request
 * carrying an expired Bearer token, including /auth/refresh and /auth/login, so sending the old
 * access token there would make a refresh/login impossible.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
	const baseUrl = inject(API_BASE_URL);
	if (!request.url.startsWith(baseUrl)) return next(request);

	const storage = inject(StorageManager);
	const auth = inject(AuthService);

	const isAuthEndpoint = request.url.startsWith(`${baseUrl}/auth/`);
	const withToken = (token: string | null): HttpRequest<unknown> =>
		token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

	const usedToken = isAuthEndpoint ? null : storage.getAccessToken();

	return next(withToken(usedToken)).pipe(
		catchError((error: unknown) => {
			if (error instanceof HttpErrorResponse && error.status === 401 && usedToken) {
				return auth.ensureFreshSession(usedToken).pipe(
					switchMap(() => next(withToken(storage.getAccessToken()))),
					catchError((retryError: unknown) => throwError(() => toApiError(retryError))),
				);
			}
			return throwError(() => toApiError(error));
		}),
	);
};
