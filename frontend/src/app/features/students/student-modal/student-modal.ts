import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '../../../shared/ui/alert/alert.service';
import { ModalShell } from '../../../shared/ui/modal-shell/modal-shell';
import { Student, StudentPayload } from '../student.model';
import { validateStudentForm } from '../student.validation';

export type StudentModalMode = 'view' | 'add' | 'edit';

export interface StudentModalState {
	mode: StudentModalMode;
	student: Student | null;
	/** Open the "are you sure?" confirmation right away (delete started from the toolbar). */
	confirmDelete?: boolean;
}

export type StudentSaveEvent =
	| { mode: 'add'; data: StudentPayload }
	/** `isuId` is the CURRENT ISU ID of the student; `data.isuId` may carry a new one. */
	| { mode: 'edit'; isuId: number; data: StudentPayload };

/** <input type="date"> accepts only "YYYY-MM-DD", while Student.settlementTerm is a Date object */
export const toDateInputValue = (date: Date | null | undefined): string =>
	date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '';

/** Student popup in 3 modes: view, add, edit (was ModalComponent). */
@Component({
	selector: 'app-student-modal',
	imports: [ReactiveFormsModule, ModalShell],
	templateUrl: './student-modal.html',
	styleUrl: './student-modal.scss',
})
export class StudentModal {
	readonly state = input.required<StudentModalState>();

	readonly closed = output<void>();
	readonly save = output<StudentSaveEvent>();
	readonly remove = output<number>();
	/** "Обновить" in view mode */
	readonly switchToEdit = output<number>();
	/** "Отмена" in edit mode: back to the read-only view */
	readonly cancelEdit = output<number>();

	private readonly alert = inject(AlertService);

	protected readonly mode = computed(() => this.state().mode);
	protected readonly isuId = computed(() => this.state().student?.isuId ?? null);
	protected readonly title = computed(() => {
		switch (this.mode()) {
			case 'add':
				return 'Добавление нового студента';
			case 'edit':
				return 'Редактирование данных студента';
			default:
				return 'Информация о студенте';
		}
	});

	/** A fresh form every time the state changes (view -> edit, new student, ...). */
	protected readonly form = computed(() => this.buildForm(this.state()));

	protected readonly confirmingDelete = linkedSignal(() => this.state().confirmDelete ?? false);

	private buildForm({ mode, student }: StudentModalState) {
		const disabled = mode === 'view';
		const text = (value: string) => new FormControl({ value, disabled }, { nonNullable: true });
		const numeric = (value: number | undefined) =>
			new FormControl<number | null>({ value: value ?? null, disabled });

		return new FormGroup({
			fullName: text(student?.fullName ?? ''),
			groupName: text(student?.groupName ?? ''),
			isuId: numeric(student?.isuId),
			dormitoryNumber: numeric(student?.dormitoryNumber),
			roomNumber: text(student?.roomNumber ?? ''),
			settlementTerm: text(toDateInputValue(student?.settlementTerm)),
			foreigner: new FormControl(
				{ value: student?.foreigner ?? false, disabled },
				{ nonNullable: true },
			),
			notes: text(student?.notes ?? ''),
		});
	}

	protected submit(): void {
		const mode = this.mode();
		if (mode === 'view') return;

		const value = this.form().getRawValue();
		const data: StudentPayload = {
			fullName: value.fullName,
			groupName: value.groupName,
			isuId: Number(value.isuId),
			dormitoryNumber: Number(value.dormitoryNumber),
			roomNumber: value.roomNumber,
			settlementTerm: value.settlementTerm,
			foreigner: value.foreigner,
			notes: value.notes,
		};

		const validation = validateStudentForm(data);
		if (!validation.isValid) {
			this.alert.error(validation.errors[0]);
			return;
		}

		if (mode === 'add') {
			this.save.emit({ mode, data });
			return;
		}

		const isuId = this.isuId();
		if (isuId !== null) this.save.emit({ mode, isuId, data });
	}

	protected reset(): void {
		this.form().reset();
	}

	protected onSwitchToEdit(): void {
		const isuId = this.isuId();
		if (isuId !== null) this.switchToEdit.emit(isuId);
	}

	protected onCancelEdit(): void {
		const isuId = this.isuId();
		if (isuId !== null) this.cancelEdit.emit(isuId);
	}

	protected confirmDelete(): void {
		const isuId = this.isuId();
		if (isuId !== null) this.remove.emit(isuId);
	}
}
