import { HttpErrorResponse } from '@angular/common/http';

/** HTTP error carrying the status code so callers can tell failures apart (was HttpError). */
export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export const CONNECTION_ERROR_MESSAGE = 'Ошибка подключения к серверу Backend!';
export const SESSION_EXPIRED_MESSAGE = 'Сессия истекла. Пожалуйста, войдите снова.';

/** Normalises anything thrown by HttpClient into an ApiError with the backend's message. */
export function toApiError(error: unknown): ApiError {
	if (error instanceof ApiError) return error;

	if (error instanceof HttpErrorResponse) {
		if (error.status === 0) return new ApiError(CONNECTION_ERROR_MESSAGE, 0);

		const body: unknown = error.error;
		const backendMessage =
			typeof body === 'object' && body !== null && 'message' in body ? body.message : null;
		return new ApiError(
			typeof backendMessage === 'string' && backendMessage
				? backendMessage
				: `API Error: ${error.status}`,
			error.status,
		);
	}

	return new ApiError(error instanceof Error ? error.message : String(error), 0);
}

/** Message to show the user: the error's own message, or the fallback when it has none. */
export function errorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}
