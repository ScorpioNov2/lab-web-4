import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthResponse } from '../auth/auth.model';
import { AuthService } from '../auth/auth.service';
import { StorageManager } from '../storage/storage-manager';
import { ApiError } from './api-error';
import { authInterceptor } from './auth.interceptor';

const BASE = 'http://localhost:8080/api';
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

const session = (accessToken: string, refreshToken: string): AuthResponse => ({
	accessToken,
	refreshToken,
	tokenType: 'Bearer',
	accessExpiresInSeconds: 900,
	user: null,
});

describe('authInterceptor', () => {
	let http: HttpClient;
	let controller: HttpTestingController;
	let storage: StorageManager;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([authInterceptor])),
				provideHttpClientTesting(),
			],
		});
		storage = TestBed.inject(StorageManager);
		storage.clearAuth();
		http = TestBed.inject(HttpClient);
		controller = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		controller.verify();
		storage.clearAuth();
	});

	it('attaches the bearer token to API calls but not to /auth/*', () => {
		storage.saveAuthSession(session('A', 'r1'));

		http.get(`${BASE}/students`).subscribe();
		expect(controller.expectOne(`${BASE}/students`).request.headers.get('Authorization')).toBe(
			'Bearer A',
		);

		http.post(`${BASE}/auth/login`, {}).subscribe();
		expect(
			controller.expectOne(`${BASE}/auth/login`).request.headers.has('Authorization'),
		).toBe(false);
	});

	it('sends no Authorization header for a guest', () => {
		http.get(`${BASE}/students`).subscribe();
		expect(controller.expectOne(`${BASE}/students`).request.headers.has('Authorization')).toBe(
			false,
		);
	});

	it('does not touch requests to other hosts', () => {
		storage.saveAuthSession(session('A', 'r1'));
		http.get('https://example.com/data').subscribe();
		expect(
			controller.expectOne('https://example.com/data').request.headers.has('Authorization'),
		).toBe(false);
	});

	it('refreshes the token on a 401 and replays the request once', () => {
		storage.saveAuthSession(session('old', 'r1'));
		let result: unknown;
		http.get(`${BASE}/students`).subscribe((value) => (result = value));

		controller.expectOne(`${BASE}/students`).flush({ message: 'expired' }, UNAUTHORIZED);

		const refresh = controller.expectOne(`${BASE}/auth/refresh`);
		expect(refresh.request.body).toEqual({ refreshToken: 'r1' });
		expect(refresh.request.headers.has('Authorization')).toBe(false);
		refresh.flush({ accessToken: 'new', refreshToken: 'r2' });

		const retry = controller.expectOne(`${BASE}/students`);
		expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
		retry.flush({ ok: true });

		expect(result).toEqual({ ok: true });
		expect(storage.getAuthSession()?.refreshToken).toBe('r2');
	});

	it('shares ONE refresh between concurrent 401s (refresh tokens are single-use)', () => {
		storage.saveAuthSession(session('old', 'r1'));
		const results: unknown[] = [];
		http.get(`${BASE}/a`).subscribe((value) => results.push(value));
		http.get(`${BASE}/b`).subscribe((value) => results.push(value));

		controller.expectOne(`${BASE}/a`).flush(null, UNAUTHORIZED);
		controller.expectOne(`${BASE}/b`).flush(null, UNAUTHORIZED);

		const refreshes = controller.match(`${BASE}/auth/refresh`);
		expect(refreshes).toHaveLength(1);
		refreshes[0].flush({ accessToken: 'new', refreshToken: 'r2' });

		controller.expectOne(`${BASE}/a`).flush('A');
		controller.expectOne(`${BASE}/b`).flush('B');
		expect(results).toEqual(['A', 'B']);
	});

	it('fails with "session expired" and goes back to guest when the refresh fails', () => {
		storage.saveAuthSession(session('old', 'r1'));
		const auth = TestBed.inject(AuthService);
		const expired = vi.fn();
		auth.sessionExpired$.subscribe(expired);

		let error: unknown;
		http.get(`${BASE}/students`).subscribe({ error: (e: unknown) => (error = e) });

		controller.expectOne(`${BASE}/students`).flush(null, UNAUTHORIZED);
		controller.expectOne(`${BASE}/auth/refresh`).flush({ message: 'revoked' }, UNAUTHORIZED);

		expect(error).toBeInstanceOf(ApiError);
		expect((error as ApiError).status).toBe(401);
		expect((error as ApiError).message).toBe('Сессия истекла. Пожалуйста, войдите снова.');
		expect(expired).toHaveBeenCalledTimes(1);
		expect(storage.getAccessToken()).toBeNull();
		expect(auth.isLoggedIn()).toBe(false);
	});

	it('does not refresh a second time when the replayed request is rejected again', () => {
		storage.saveAuthSession(session('old', 'r1'));
		let error: unknown;
		http.get(`${BASE}/students`).subscribe({ error: (e: unknown) => (error = e) });

		controller.expectOne(`${BASE}/students`).flush(null, UNAUTHORIZED);
		controller
			.expectOne(`${BASE}/auth/refresh`)
			.flush({ accessToken: 'new', refreshToken: 'r2' });
		controller
			.expectOne(`${BASE}/students`)
			.flush({ message: 'Forbidden for you' }, { status: 401, statusText: 'Unauthorized' });

		expect((error as ApiError).message).toBe('Forbidden for you');
		controller.expectNone(`${BASE}/auth/refresh`);
	});

	it('maps failures to ApiError with the backend message, or a generic one', () => {
		const errors: ApiError[] = [];
		http.get(`${BASE}/a`).subscribe({ error: (e: ApiError) => errors.push(e) });
		http.get(`${BASE}/b`).subscribe({ error: (e: ApiError) => errors.push(e) });
		http.get(`${BASE}/c`).subscribe({ error: (e: ApiError) => errors.push(e) });

		controller
			.expectOne(`${BASE}/a`)
			.flush({ message: 'ISU ID уже существует' }, { status: 409, statusText: 'Conflict' });
		controller
			.expectOne(`${BASE}/b`)
			.flush('<html>', { status: 500, statusText: 'Server Error' });
		controller.expectOne(`${BASE}/c`).error(new ProgressEvent('error'));

		expect(errors.map((e) => [e.status, e.message])).toEqual([
			[409, 'ISU ID уже существует'],
			[500, 'API Error: 500'],
			[0, 'Ошибка подключения к серверу Backend!'],
		]);
	});
});
