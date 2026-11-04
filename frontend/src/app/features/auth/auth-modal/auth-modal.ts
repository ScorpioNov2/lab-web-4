import { Component, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { errorMessage } from '../../../core/http/api-error';
import { AlertService } from '../../../shared/ui/alert/alert.service';
import { ModalShell } from '../../../shared/ui/modal-shell/modal-shell';
import { WelcomePigeonService } from '../../../theme/welcome-pigeon/welcome-pigeon.service';
import { validateLoginForm, validateRegisterForm } from '../auth.validation';
import { AuthModalService } from '../auth-modal.service';

/** Login / registration popup (was AuthModalComponent + AuthHandler's submit logic). */
@Component({
	selector: 'app-auth-modal',
	imports: [ReactiveFormsModule, ModalShell],
	templateUrl: './auth-modal.html',
	styleUrl: './auth-modal.scss',
})
export class AuthModal {
	protected readonly modal = inject(AuthModalService);
	private readonly auth = inject(AuthService);
	private readonly alert = inject(AlertService);
	private readonly pigeon = inject(WelcomePigeonService);
	private readonly fb = inject(NonNullableFormBuilder);

	protected readonly loginForm = this.fb.group({
		loginIdentifier: '',
		password: '',
	});

	protected readonly registerForm = this.fb.group({
		fullName: '',
		username: '',
		email: '',
		password: '',
		passwordConfirm: '',
	});

	protected readonly showPassword = signal(false);
	protected readonly showPasswordConfirm = signal(false);

	constructor() {
		// Every time the popup opens or switches between login/register it starts empty.
		effect(() => {
			this.modal.mode();
			untracked(() => {
				this.loginForm.reset();
				this.registerForm.reset();
				this.showPassword.set(false);
				this.showPasswordConfirm.set(false);
			});
		});

		// The refresh token no longer works: ask the user to log in again.
		this.auth.sessionExpired$
			.pipe(takeUntilDestroyed())
			.subscribe(() => this.modal.open('login'));
	}

	protected title(mode: 'login' | 'register'): string {
		return mode === 'login' ? 'Вход в систему' : 'Регистрация';
	}

	protected submitLogin(): void {
		// The identifier may be either a username or an email
		const credentials = this.loginForm.getRawValue();

		const validation = validateLoginForm(credentials);
		if (!validation.isValid) {
			this.alert.error(validation.errors[0]);
			return;
		}

		this.auth.login(credentials).subscribe({
			next: (response) => {
				this.modal.close();
				this.alert.success('Вы успешно вошли в систему!');
				this.pigeon.fly(response.user?.fullName || response.user?.username);
			},
			error: (error: unknown) =>
				this.alert.error(
					errorMessage(error, 'Ошибка авторизации! Проверьте логин и пароль.'),
				),
		});
	}

	protected submitRegister(): void {
		const registration = this.registerForm.getRawValue();

		// Проверка совпадения паролей
		if (registration.password !== registration.passwordConfirm) {
			this.alert.error('Пароли не совпадают! Пожалуйста, проверьте ввод.');
			return;
		}

		// Полная валидация полей формы регистрации
		const validation = validateRegisterForm(registration);
		if (!validation.isValid) {
			this.alert.error(validation.errors[0]);
			return;
		}

		this.auth.register(registration).subscribe({
			next: () => {
				this.alert.success('Регистрация прошла успешно! Теперь вы можете войти.');
				this.modal.open('login');
			},
			error: (error: unknown) =>
				this.alert.error(
					errorMessage(error, 'Ошибка при регистрации нового пользователя.'),
				),
		});
	}
}
