import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url';
import { toUser, User, UserDto } from './auth.model';

@Injectable({ providedIn: 'root' })
export class UserApi {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = inject(API_BASE_URL);

	/** Получить подробную информацию о пользователе по ID (GET) */
	getById(userId: number): Observable<User> {
		return this.http.get<UserDto>(`${this.baseUrl}/users/${userId}`).pipe(map(toUser));
	}

	/** Получить информацию о текущем вошедшем в систему аккаунте (GET) */
	getCurrent(): Observable<User> {
		return this.http.get<UserDto>(`${this.baseUrl}/users/me`).pipe(map(toUser));
	}
}
