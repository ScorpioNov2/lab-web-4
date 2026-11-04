import { LoginRequest, RegisterRequest } from '../../core/auth/auth.model';
import { toValidationResult, ValidationResult } from '../../shared/validation/validation-result';

/** 5-20 chars, latin letters/digits/'-'/'_', must not start or end with a special character. */
const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{3,18}[a-zA-Z0-9]$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Валидация формы входа */
export function validateLoginForm(form: LoginRequest): ValidationResult {
	const errors: string[] = [];
	const loginIdentifier = form.loginIdentifier?.trim() || '';
	const password = form.password || '';

	// Проверка логина (Идентификатора)
	if (loginIdentifier === '') {
		errors.push('Имя пользователя или Email не должны быть пустыми!');
	} else if (loginIdentifier.length < 5) {
		errors.push('Логин должен содержать не менее 5 символов!');
	} else if (!loginIdentifier.includes('@')) {
		// Если это НЕ email, значит это Username -> check Regex
		if (!USERNAME_REGEX.test(loginIdentifier)) {
			errors.push(
				"Неверный формат имени пользователя! Имя не должно начинаться или заканчиваться на '_' или '-'.",
			);
		}
	}

	// Проверка пароля
	if (password === '') {
		errors.push('Пароль не должен быть пустым!');
	}

	return toValidationResult(errors);
}

/** Валидация формы регистрации */
export function validateRegisterForm(form: RegisterRequest): ValidationResult {
	const errors: string[] = [];

	const fullName = form.fullName?.trim() || '';
	const username = form.username?.trim().toLowerCase() || ''; // Admin = admin = aDmin = ... = ADMIN
	const email = form.email?.trim() || '';
	const password = form.password || '';

	// Проверка ФИО
	if (fullName === '') {
		errors.push('ФИО не должно быть пустым!');
	} else if (/\d/.test(fullName)) {
		errors.push('ФИО не должно содержать цифры!');
	}

	// Проверка Имени пользователя (Username)
	if (username === '') {
		errors.push('Имя пользователя (Username) не должно быть пустым!');
	} else if (!USERNAME_REGEX.test(username)) {
		errors.push(
			"Username должен содержать 5-20 символов (только латиница, цифры, '-' и '_') и не должен начинаться или заканчиваться на спецсимволы!",
		);
	}

	// Проверка Электронной почты (Email)
	if (email === '') {
		errors.push('Электронная почта не должна быть пустой!');
	} else if (!EMAIL_REGEX.test(email)) {
		errors.push('Пожалуйста, введите корректный адрес электронной почты!');
	}

	// Проверка Пароля
	if (password.trim().length < 6) {
		errors.push(
			'Пароль должен содержать не менее 6 символов (без учета пробелов в начале/конце)!',
		);
	}

	return toValidationResult(errors);
}
