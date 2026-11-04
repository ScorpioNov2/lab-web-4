import { toValidationResult, ValidationResult } from '../../shared/validation/validation-result';
import { StudentPayload } from './student.model';

export function validateStudentForm(form: StudentPayload): ValidationResult {
	const errors: string[] = [];

	if (!form.fullName || form.fullName.trim() === '' || /\d/.test(form.fullName)) {
		errors.push('ФИО студента не должно быть пустым или содержать число!');
	}

	if (!form.groupName || form.groupName.trim() === '') {
		errors.push('Название группы/класса не должно быть пустым!');
	}

	if (!form.isuId || isNaN(form.isuId)) {
		errors.push('Номер ISU ID должен быть корректным числом!');
	}

	if (!form.dormitoryNumber || isNaN(form.dormitoryNumber)) {
		errors.push('Номер корпуса общежития должен быть числом!');
	}

	if (!form.roomNumber || form.roomNumber.trim() === '') {
		errors.push('Номер комнаты не должен быть пустым!');
	}

	if (!form.settlementTerm) {
		errors.push('Пожалуйста, выберите срок проживания!');
	}

	return toValidationResult(errors);
}
