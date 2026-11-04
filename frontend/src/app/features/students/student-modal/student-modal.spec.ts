import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertService } from '../../../shared/ui/alert/alert.service';
import { Student } from '../student.model';
import {
	StudentModal,
	StudentModalState,
	StudentSaveEvent,
	toDateInputValue,
} from './student-modal';

const ivan: Student = {
	fullName: 'Иван Петров',
	groupName: 'K3101',
	isuId: 5,
	dormitoryNumber: 3,
	roomNumber: '305',
	settlementTerm: new Date('2026-09-01'),
	foreigner: true,
	notes: 'тихий',
	createdAt: null,
};

describe('StudentModal', () => {
	function setup(state: StudentModalState) {
		const fixture: ComponentFixture<StudentModal> = TestBed.createComponent(StudentModal);
		fixture.componentRef.setInput('state', state);
		const events = {
			closed: vi.fn(),
			save: vi.fn<(event: StudentSaveEvent) => void>(),
			remove: vi.fn<(isuId: number) => void>(),
			switchToEdit: vi.fn<(isuId: number) => void>(),
			cancelEdit: vi.fn<(isuId: number) => void>(),
		};
		fixture.componentInstance.closed.subscribe(events.closed);
		fixture.componentInstance.save.subscribe(events.save);
		fixture.componentInstance.remove.subscribe(events.remove);
		fixture.componentInstance.switchToEdit.subscribe(events.switchToEdit);
		fixture.componentInstance.cancelEdit.subscribe(events.cancelEdit);
		fixture.detectChanges();

		const root: HTMLElement = fixture.nativeElement;
		return {
			fixture,
			root,
			events,
			input: (id: string) => root.querySelector<HTMLInputElement>(`#${id}`)!,
			footerButtons: () =>
				Array.from(root.querySelectorAll<HTMLButtonElement>('.modal-footer button')),
			button: (label: string) =>
				Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
					(candidate) => candidate.textContent?.trim() === label,
				)!,
		};
	}

	it('view: shows the student read-only with Обновить / Удалить in the footer', () => {
		const { root, input, footerButtons, events, button } = setup({
			mode: 'view',
			student: ivan,
		});

		expect(root.querySelector('.modal-title')?.textContent).toBe('Информация о студенте');
		expect(input('form-fullName').value).toBe('Иван Петров');
		expect(input('form-isuId').value).toBe('5');
		expect(input('form-settlementTerm').value).toBe('2026-09-01');
		expect(input('form-isForeigner').checked).toBe(true);
		expect(root.querySelectorAll('input:disabled, textarea:disabled')).toHaveLength(8);

		expect(footerButtons().map((b) => b.textContent?.trim())).toEqual(['Обновить', 'Удалить']);
		button('Обновить').click();
		expect(events.switchToEdit).toHaveBeenCalledWith(5);
	});

	it('view: asks for confirmation before deleting', () => {
		const { fixture, root, button, events } = setup({ mode: 'view', student: ivan });
		expect(root.querySelector('.modal-overlay-nested')).toBeNull();

		button('Удалить').click();
		fixture.detectChanges();
		expect(root.querySelector('.modal-overlay-nested .modal-title')?.textContent).toBe(
			'Подтверждение удаления',
		);

		// cancel: the confirmation goes away, nothing is deleted
		button('Отмена').click();
		fixture.detectChanges();
		expect(root.querySelector('.modal-overlay-nested')).toBeNull();
		expect(events.remove).not.toHaveBeenCalled();

		// confirm
		button('Удалить').click();
		fixture.detectChanges();
		root.querySelector<HTMLButtonElement>('.modal-overlay-nested .btn-danger')!.click();
		expect(events.remove).toHaveBeenCalledExactlyOnceWith(5);
	});

	it('view: can open straight on the confirmation (delete from the toolbar)', () => {
		const { root } = setup({ mode: 'view', student: ivan, confirmDelete: true });
		expect(root.querySelector('.modal-overlay-nested')).not.toBeNull();
	});

	it('closes from the × button and from a click on the dark overlay, but not on the window', () => {
		const { root, events } = setup({ mode: 'view', student: ivan });

		root.querySelector<HTMLElement>('.modal-window')!.click();
		expect(events.closed).not.toHaveBeenCalled();

		root.querySelector<HTMLElement>('.modal-overlay')!.click();
		root.querySelector<HTMLButtonElement>('.close-modal-button')!.click();
		expect(events.closed).toHaveBeenCalledTimes(2);
	});

	it('the confirmation cannot be dismissed by clicking its overlay', () => {
		const { root, events } = setup({ mode: 'view', student: ivan, confirmDelete: true });
		root.querySelector<HTMLElement>('.modal-overlay-nested')!.click();
		expect(root.querySelector('.modal-overlay-nested')).not.toBeNull();
		expect(events.closed).not.toHaveBeenCalled();
		expect(root.querySelectorAll('.close-modal-button')).toHaveLength(1);
	});

	it('edit: submits the changed values with numbers converted, keyed by the CURRENT isuId', () => {
		const { fixture, root, input, button, events } = setup({ mode: 'edit', student: ivan });
		expect(root.querySelector('.modal-title')?.textContent).toBe(
			'Редактирование данных студента',
		);

		input('form-fullName').value = 'Пётр Иванов';
		input('form-fullName').dispatchEvent(new Event('input'));
		input('form-isuId').value = '6';
		input('form-isuId').dispatchEvent(new Event('input'));
		fixture.detectChanges();

		button('Сохранить').click();
		expect(events.save).toHaveBeenCalledExactlyOnceWith({
			mode: 'edit',
			isuId: 5,
			data: {
				fullName: 'Пётр Иванов',
				groupName: 'K3101',
				isuId: 6,
				dormitoryNumber: 3,
				roomNumber: '305',
				settlementTerm: '2026-09-01',
				foreigner: true,
				notes: 'тихий',
			},
		});
	});

	it('edit: Отмена goes back to the view', () => {
		const { button, events } = setup({ mode: 'edit', student: ivan });
		button('Отмена').click();
		expect(events.cancelEdit).toHaveBeenCalledWith(5);
	});

	it('does not submit invalid data and shows the first problem instead', () => {
		const { fixture, input, button, events } = setup({ mode: 'edit', student: ivan });
		input('form-fullName').value = 'Иван 2';
		input('form-fullName').dispatchEvent(new Event('input'));
		fixture.detectChanges();

		button('Сохранить').click();
		expect(events.save).not.toHaveBeenCalled();
		expect(TestBed.inject(AlertService).toasts()[0]).toMatchObject({
			message: 'ФИО студента не должно быть пустым или содержать число!',
			type: 'error',
		});
	});

	it('add: starts empty, validates, resets, and submits a new student', () => {
		const { fixture, root, input, button, events } = setup({ mode: 'add', student: null });
		expect(root.querySelector('.modal-title')?.textContent).toBe('Добавление нового студента');
		expect(input('form-fullName').value).toBe('');
		expect(input('form-isuId').value).toBe('');

		button('Добавить').click(); // empty form
		expect(events.save).not.toHaveBeenCalled();

		const fill = (id: string, value: string) => {
			input(id).value = value;
			input(id).dispatchEvent(new Event('input'));
		};
		fill('form-fullName', 'Анна Смирнова');
		fill('form-groupName', 'M3302');
		fill('form-isuId', '777');
		fill('form-dormitoryNumber', '2');
		fill('form-roomNumber', '12');
		fill('form-settlementTerm', '2026-10-01');
		fixture.detectChanges();

		button('Сбросить').click();
		fixture.detectChanges();
		expect(input('form-fullName').value).toBe('');

		fill('form-fullName', 'Анна Смирнова');
		fill('form-groupName', 'M3302');
		fill('form-isuId', '777');
		fill('form-dormitoryNumber', '2');
		fill('form-roomNumber', '12');
		fill('form-settlementTerm', '2026-10-01');
		button('Добавить').click();

		expect(events.save).toHaveBeenCalledExactlyOnceWith({
			mode: 'add',
			data: {
				fullName: 'Анна Смирнова',
				groupName: 'M3302',
				isuId: 777,
				dormitoryNumber: 2,
				roomNumber: '12',
				settlementTerm: '2026-10-01',
				foreigner: false,
				notes: '',
			},
		});
	});

	it('switching the state view -> edit enables the form with the same data', () => {
		const { fixture, input } = setup({ mode: 'view', student: ivan });
		expect(input('form-fullName').disabled).toBe(true);

		fixture.componentRef.setInput('state', { mode: 'edit', student: ivan });
		fixture.detectChanges();
		expect(input('form-fullName').disabled).toBe(false);
		expect(input('form-fullName').value).toBe('Иван Петров');
	});

	describe('toDateInputValue', () => {
		it('formats a Date as YYYY-MM-DD and copes with missing or invalid dates', () => {
			expect(toDateInputValue(new Date('2026-09-01'))).toBe('2026-09-01');
			expect(toDateInputValue(null)).toBe('');
			expect(toDateInputValue(new Date('garbage'))).toBe('');
		});
	});
});
