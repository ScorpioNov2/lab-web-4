import { StudentPayload } from './student.model';
import { validateStudentForm } from './student.validation';

const valid: StudentPayload = {
	fullName: 'Иван Петров',
	groupName: 'K3101',
	isuId: 123456,
	dormitoryNumber: 3,
	roomNumber: '305B',
	settlementTerm: '2026-09-01',
	foreigner: false,
	notes: '',
};

describe('validateStudentForm', () => {
	it('accepts a complete form (notes are optional)', () => {
		expect(validateStudentForm(valid).isValid).toBe(true);
	});

	it('rejects digits in the name and empty required fields, in field order', () => {
		const { errors } = validateStudentForm({
			...valid,
			fullName: 'Иван 2',
			groupName: ' ',
			isuId: 0,
			dormitoryNumber: NaN,
			roomNumber: '',
			settlementTerm: '',
		});
		expect(errors).toEqual([
			'ФИО студента не должно быть пустым или содержать число!',
			'Название группы/класса не должно быть пустым!',
			'Номер ISU ID должен быть корректным числом!',
			'Номер корпуса общежития должен быть числом!',
			'Номер комнаты не должен быть пустым!',
			'Пожалуйста, выберите срок проживания!',
		]);
	});
});
