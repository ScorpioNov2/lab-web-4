import { validateLoginForm, validateRegisterForm } from './auth.validation';

describe('auth validation', () => {
	describe('validateLoginForm', () => {
		it('accepts a username or an email with a password', () => {
			expect(
				validateLoginForm({ loginIdentifier: 'ivan_ivanov', password: 'x' }).isValid,
			).toBe(true);
			expect(validateLoginForm({ loginIdentifier: 'a@b.ru', password: 'x' }).isValid).toBe(
				true,
			);
		});

		it('reports an empty identifier and password', () => {
			const { isValid, errors } = validateLoginForm({ loginIdentifier: '  ', password: '' });
			expect(isValid).toBe(false);
			expect(errors).toEqual([
				'Имя пользователя или Email не должны быть пустыми!',
				'Пароль не должен быть пустым!',
			]);
		});

		it('rejects a short login and a username that starts or ends with a special character', () => {
			expect(validateLoginForm({ loginIdentifier: 'abcd', password: 'x' }).errors[0]).toBe(
				'Логин должен содержать не менее 5 символов!',
			);
			expect(
				validateLoginForm({ loginIdentifier: '_abcde', password: 'x' }).errors[0],
			).toContain('Неверный формат имени пользователя');
		});
	});

	describe('validateRegisterForm', () => {
		const valid = {
			fullName: 'Иванов Иван',
			username: 'Ivan_Ivanov',
			email: 'ivan@mail.ru',
			password: 'secret1',
			passwordConfirm: 'secret1',
		};

		it('accepts valid data (the username is checked case-insensitively)', () => {
			expect(validateRegisterForm(valid).isValid).toBe(true);
		});

		it('checks every field', () => {
			expect(validateRegisterForm({ ...valid, fullName: 'Иван 2' }).errors).toEqual([
				'ФИО не должно содержать цифры!',
			]);
			expect(validateRegisterForm({ ...valid, username: 'ab' }).errors[0]).toContain(
				'Username должен',
			);
			expect(validateRegisterForm({ ...valid, email: 'nope' }).errors).toEqual([
				'Пожалуйста, введите корректный адрес электронной почты!',
			]);
			expect(validateRegisterForm({ ...valid, password: ' 123  ' }).errors[0]).toContain(
				'не менее 6 символов',
			);
		});
	});
});
