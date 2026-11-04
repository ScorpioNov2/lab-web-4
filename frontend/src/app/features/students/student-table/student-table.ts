import { Component, input, output } from '@angular/core';
import { Student } from '../student.model';
import { SortDirection } from '../student-criteria';

interface Column {
	field: string;
	label: string;
}

/** The students table (was TableComponent). Purely presentational: the page owns all state. */
@Component({
	selector: 'app-student-table',
	templateUrl: './student-table.html',
	styleUrl: './student-table.scss',
})
export class StudentTable {
	readonly students = input.required<Student[]>();
	readonly sortField = input('');
	readonly sortDirection = input<SortDirection>('');
	/** ISU ID of the selected row */
	readonly focusedIsuId = input<number | null>(null);

	/** A column header was clicked */
	readonly sort = output<string>();
	/** A row was clicked (selected) */
	readonly rowSelect = output<number>();
	/** A row was double-clicked (open details) */
	readonly rowOpen = output<number>();

	protected readonly columns: Column[] = [
		{ field: 'fullName', label: 'ФИО Студента' },
		{ field: 'groupName', label: 'Группа' },
		{ field: 'isuId', label: 'ИСУ ID' },
		{ field: 'dormitoryNumber', label: 'Общежитие №' },
		{ field: 'roomNumber', label: 'Комната' },
	];

	protected sortIcon(field: string): string {
		if (this.sortField() !== field) return '';
		return this.sortDirection() === 'asc' ? '▲' : this.sortDirection() === 'desc' ? '▼' : '';
	}

	protected ariaSort(field: string): 'ascending' | 'descending' | 'none' {
		if (this.sortField() !== field) return 'none';
		return this.sortDirection() === 'asc'
			? 'ascending'
			: this.sortDirection() === 'desc'
				? 'descending'
				: 'none';
	}

	protected onRowSpace(event: Event, isuId: number): void {
		event.preventDefault(); // do not scroll the page
		this.rowSelect.emit(isuId);
	}
}
