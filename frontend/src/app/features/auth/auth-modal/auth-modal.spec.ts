import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/auth/auth.service';
import { authInterceptor } from '../../../core/http/auth.interceptor';
import { StorageManager } from '../../../core/storage/storage-manager';
import { AlertService } from '../../../shared/ui/alert/alert.service';
import { WelcomePigeonService } from '../../../theme/welcome-pigeon/welcome-pigeon.service';
import { AuthModalService } from '../auth-modal.service';
import { AuthModal } from './auth-modal';

const API = 'http://localhost:8080/api';

describe('AuthModal', () => {
	let fixture: ComponentFixture<AuthModal>;
	let controller: HttpTestingController;
	let modal: AuthModalService;
	let alerts: AlertService;
	let root: HTMLElement;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([authInterceptor])),
				provideHttpClientTesting(),
			],
		});
		TestBed.inject(StorageManager).clearAuth();
		controller = TestBed.inject(HttpTestingController);
		modal = TestBed.inject(AuthModalService);
		alerts = TestBed.inject(AlertService);
		fixture = TestBed.createComponent(AuthModal);
		root = fixture.nativeElement;
	});

	afterEach(() => {
		controller.verify();
		TestBed.inject(StorageManager).clearAuth();
	});

	const render = async () => {
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
	};
	const field = (id: string) => root.querySelector<HTMLInputElement>(`#${id}`)!;
	const type = (id: string, value: string) => {
		field(id).value = value;
		field(id).dispatchEvent(new Event('input'));
	};
	const submit = () =>
		root.querySelector<HTMLFormElement>('#auth-modal-form')!.dispatchEvent(new Event('submit'));
	const title = () => root.querySelector('.modal-title')?.textContent;
	const footer = () =>
		Array.from(root.querySelectorAll('.modal-footer button')).map((b) => b.textContent?.trim());

	it('renders nothing while closed', async () => {
		await render();
		expect(root.querySelector('.modal-overlay')).toBeNull();
	});

	it('opens the login form with the switch and submit buttons in the footer', async () => {
		modal.open('login');
		await render();

		expect(title()).toBe('Вход в систему');
		expect(field('auth-login-identifier')).not.toBeNull();
		expect(footer()).toEqual(['Регистрация', 'Войти']);
		expect(root.querySelector('button[type="submit"]')?.getAttribute('form')).toBe(
			'auth-modal-form',
		);
	});

	it('shows the first validation problem and sends nothing', async () => {
		modal.open('login');
		await render();

		submit();
		expect(alerts.toasts()[0].message).toBe(
			'Имя пользователя или Email не должны быть пустыми!',
		);
		controller.expectNone(`${API}/auth/login`);
	});

	it('logs in: stores the session, closes, greets, and starts the welcome flight', async () => {
		modal.open('login');
		await render();
		type('auth-login-identifier', 'ivan_ivanov');
		type('auth-password', 'secret1');
		submit();

		const request = controller.expectOne(`${API}/auth/login`);
		expect(request.request.body).toEqual({
			loginIdentifier: 'ivan_ivanov',
			password: 'secret1',
		});
		request.flush({
			accessToken: 'A',
			refreshToken: 'R',
			tokenType: 'Bearer',
			accessExpiresInSeconds: 900,
			user: {
				id: 1,
				fullName: 'Иван Иванов',
				username: 'ivan_ivanov',
				email: 'i@i.ru',
				role: 'admin',
			},
		});
		await render();

		expect(modal.mode()).toBeNull();
		expect(root.querySelector('.modal-overlay')).toBeNull();
		expect(alerts.toasts()[0]).toMatchObject({
			message: 'Вы успешно вошли в систему!',
			type: 'success',
		});
		expect(TestBed.inject(WelcomePigeonService).request()?.name).toBe('Иван Иванов');
		expect(TestBed.inject(AuthService).isLoggedIn()).toBe(true);
		expect(TestBed.inject(StorageManager).getAccessToken()).toBe('A');
	});

	it('keeps the popup open and shows the backend message when the login is rejected', async () => {
		modal.open('login');
		await render();
		type('auth-login-identifier', 'ivan_ivanov');
		type('auth-password', 'wrong');
		submit();

		controller
			.expectOne(`${API}/auth/login`)
			.flush({ message: 'Неверный пароль' }, { status: 401, statusText: 'Unauthorized' });
		await render();

		expect(alerts.toasts()[0]).toMatchObject({ message: 'Неверный пароль', type: 'error' });
		expect(modal.mode()).toBe('login');
	});

	it('registers, then switches to an empty login form', async () => {
		modal.open('register');
		await render();
		expect(title()).toBe('Регистрация');
		expect(footer()).toEqual(['Вход', 'Создать аккаунт']);

		type('auth-fullName', 'Иван Иванов');
		type('auth-username', 'ivan_ivanov');
		type('auth-email', 'ivan@mail.ru');
		type('auth-register-password', 'secret1');
		type('auth-password-confirm', 'secret1');
		submit();

		const request = controller.expectOne(`${API}/auth/register`);
		expect(request.request.body).toEqual({
			fullName: 'Иван Иванов',
			username: 'ivan_ivanov',
			email: 'ivan@mail.ru',
			password: 'secret1',
			passwordConfirm: 'secret1',
		});
		request.flush({});
		await render();

		expect(alerts.toasts()[0].message).toBe(
			'Регистрация прошла успешно! Теперь вы можете войти.',
		);
		expect(modal.mode()).toBe('login');
		expect(title()).toBe('Вход в систему');
		expect(field('auth-login-identifier').value).toBe('');
	});

	it('refuses a registration whose passwords differ', async () => {
		modal.open('register');
		await render();
		type('auth-fullName', 'Иван Иванов');
		type('auth-username', 'ivan_ivanov');
		type('auth-email', 'ivan@mail.ru');
		type('auth-register-password', 'secret1');
		type('auth-password-confirm', 'secret2');
		submit();

		expect(alerts.toasts()[0].message).toBe('Пароли не совпадают! Пожалуйста, проверьте ввод.');
		controller.expectNone(`${API}/auth/register`);
	});

	it('toggles password visibility and resets the form when switching modes', async () => {
		modal.open('login');
		await render();
		expect(field('auth-password').type).toBe('password');

		root.querySelector<HTMLButtonElement>('.toggle-password-btn')!.click();
		await render();
		expect(field('auth-password').type).toBe('text');
		expect(root.querySelector<HTMLImageElement>('.eye-icon')?.getAttribute('src')).toBe(
			'assets/icons/eye-open.svg',
		);

		type('auth-login-identifier', 'something');
		modal.open('register');
		await render();
		modal.open('login');
		await render();
		expect(field('auth-login-identifier').value).toBe('');
		expect(field('auth-password').type).toBe('password');
	});

	it('opens the login form when the session expires', async () => {
		await render();
		TestBed.inject(AuthService).sessionExpired$.next();
		await render();
		expect(modal.mode()).toBe('login');
	});
});
