import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url';
import {
	AuthResponse,
	AuthResponseDto,
	LoginRequest,
	RefreshTokenRequest,
	RegisterRequest,
	toAuthResponse,
} from './auth.model';

/** Raw HTTP calls of the /auth/* endpoints (no state, no session handling). */
@Injectable({ providedIn: 'root' })
export class AuthApi {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = inject(API_BASE_URL);

	/** Вход в систему (POST) */
	login(request: LoginRequest): Observable<AuthResponse> {
		return this.http
			.post<AuthResponseDto>(`${this.baseUrl}/auth/login`, request)
			.pipe(map(toAuthResponse));
	}

	/** Регистрация нового аккаунта (POST) */
	register(request: RegisterRequest): Observable<unknown> {
		return this.http.post<unknown>(`${this.baseUrl}/auth/register`, request);
	}

	/** Обновление Access Token при истечении срока действия (POST) */
	refreshAccessToken(refreshToken: string): Observable<AuthResponse> {
		const request: RefreshTokenRequest = { refreshToken };
		return this.http
			.post<AuthResponseDto>(`${this.baseUrl}/auth/refresh`, request)
			.pipe(map(toAuthResponse));
	}
}
