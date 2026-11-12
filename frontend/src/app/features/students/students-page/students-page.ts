import {
	Component,
	computed,
	effect,
	ElementRef,
	inject,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
	catchError,
	distinctUntilChanged,
	EMPTY,
	filter,
	finalize,
	firstValueFrom,
	map,
	merge,
	Observable,
	skip,
	startWith,
	Subject,
	switchMap,
	tap,
	timer,
} from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CONNECTION_ERROR_MESSAGE, errorMessage } from '../../../core/http/api-error';
import { PagedResponse } from '../../../core/models/paged-response';
import { AlertService } from '../../../shared/ui/alert/alert.service';
import { LoadingService } from '../../../shared/ui/loading/loading.service';
import { LoadingOverlay } from '../../../shared/ui/loading/loading-overlay';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { AuthModalService } from '../../auth/auth-modal.service';
import { StudentApi } from '../student.api';
import { Student } from '../student.model';
import {
	nextSort,
	pageAfterDeletion,
	readCriteria,
	StudentCriteria,
	toQueryParams,
} from '../student-criteria';
import { StudentModal, StudentModalState, StudentSaveEvent } from '../student-modal/student-modal';
import { StudentTable } from '../student-table/student-table';

/**
 * The students screen: toolbar, table, pagination and the student popup.
 * Takes over what ApplicationController + StudentHandler did in the vanilla version.
 */
@Component({
	selector: 'app-students-page',
	imports: [StudentTable, Pagination, StudentModal, LoadingOverlay],
	templateUrl: './students-page.html',
	styleUrl: './students-page.scss',
	host: { '(document:click)': 'onDocumentClick($event)' },
})
export class StudentsPage {
	private readonly api = inject(StudentApi);
	private readonly alert = inject(AlertService);
	private readonly loading = inject(LoadingService);
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);
	protected readonly auth = inject(AuthService);
	protected readonly authModal = inject(AuthModalService);

	private readonly tableContainer = viewChild.required<ElementRef<HTMLElement>>('tableContainer');

	private readonly rowsPerPage = 10;
	private readonly searchDebounceMs = 1000;

	/** Search / sort / page. Read from the URL once at startup, mirrored back into it on every refresh. */
	protected readonly criteria = signal<StudentCriteria>(
		readCriteria(this.route.snapshot.queryParamMap),
	);

	/** null until a page was loaded successfully (guest or backend unreachable). */
	protected readonly result = signal<PagedResponse<Student> | null>(null);
	protected readonly totalStudents = computed(() => this.result()?.totalElements ?? 0);
	protected readonly students = computed(() => this.result()?.content ?? []);
	protected readonly totalPages = computed(() => this.result()?.totalPages || 1);

	/** ISU ID of the selected table row */
	protected readonly focusedIsuId = signal<number | null>(null);

	/** null = no popup */
	protected readonly modal = signal<StudentModalState | null>(null);

	private readonly refresh$ = new Subject<void>();
	private readonly search$ = new Subject<string>();

	constructor() {
		this.search$
			.pipe(
				// debounceTime(searchDebounceMs),
				map((keyword) => keyword.trim()),
				distinctUntilChanged(),
				// Trigger loading immediately on typing start (once per continuous typing session)
				tap(() => this.loading.show()),
				switchMap((searchKeyword) =>
					// Debounce for t ms; reset timer if typing continues, keep loading state intact
					timer(this.searchDebounceMs).pipe(
						tap(() => {
							this.criteria.update((criteria) => ({
								...criteria,
								searchKeyword,
								pageNumber: 1,
							}));
							this.syncUrl();
						}),
						switchMap(() => this.loadPage()),
						// Stop loading when the API call finishes OR when the user closes the page / cancels the flow
						finalize(() => this.loading.hide()),
					),
				),
				takeUntilDestroyed(),
			)
			.subscribe((page) => this.result.set(page));

		merge(
			this.refresh$,
			// guest -> logged in: show the data. (skip(1) = the value at startup, covered by startWith)
			toObservable(this.auth.isLoggedIn).pipe(skip(1), filter(Boolean)),
		)
			.pipe(
				startWith(undefined),
				// Sync state back to the URL bar
				tap(() => this.syncUrl()),
				// A newer request cancels the one still in flight (typing in the search box)
				switchMap(() => this.loadPage()),
				takeUntilDestroyed(),
			)
			.subscribe((page) => this.result.set(page));

		// Back to guest (logout, expired or invalid session): forget everything that was loaded.
		effect(() => {
			if (!this.auth.isLoggedIn()) {
				untracked(() => {
					this.result.set(null);
					this.focusedIsuId.set(null);
					this.modal.set(null);
				});
			}
		});
	}

	// ---------- toolbar ----------

	protected onSearch(event: Event): void {
		const searchKeyword = (event.target as HTMLInputElement).value;
		// this.criteria.update((criteria) => ({ ...criteria, searchKeyword, pageNumber: 1 }));
		// this.refresh();
		this.search$.next(searchKeyword);
	}

	protected openAdd(): void {
		this.modal.set({ mode: 'add', student: null });
	}

	protected editSelected(): void {
		const isuId = this.focusedIsuId();
		if (isuId !== null) void this.openEdit(isuId);
		else this.alert.error('Пожалуйста, выберите студента!');
	}

	/** Delete from the toolbar: open the student's popup with the confirmation already shown. */
	protected async deleteSelected(): Promise<void> {
		const isuId = this.focusedIsuId();
		if (isuId === null) {
			this.alert.error('Пожалуйста, выберите (кликните) студента в таблице для удаления!');
			return;
		}

		try {
			const student = await firstValueFrom(this.api.getByIsuId(isuId));
			this.modal.set({ mode: 'view', student, confirmDelete: true });
		} catch (error) {
			this.alert.error(errorMessage(error, 'Не удалось загрузить данные студента.'));
		}
	}

	// ---------- table & pagination ----------

	protected onSort(field: string): void {
		this.criteria.update((criteria) => ({ ...criteria, ...nextSort(criteria, field) }));
		this.refresh();
	}

	protected onPageChange(pageNumber: number): void {
		this.criteria.update((criteria) => ({ ...criteria, pageNumber }));
		this.refresh();
	}

	/** Double click on a row: open the read-only popup. */
	protected async openDetails(isuId: number): Promise<void> {
		try {
			const student = await firstValueFrom(this.api.getByIsuId(isuId));
			this.modal.set({ mode: 'view', student });
		} catch (error) {
			this.alert.error(
				errorMessage(error, 'Не удалось загрузить данные студента для просмотра.'),
			);
		}
	}

	/** A click outside of the table drops the row selection. */
	protected onDocumentClick(event: MouseEvent): void {
		if (!this.tableContainer().nativeElement.contains(event.target as Node)) {
			this.focusedIsuId.set(null);
		}
	}

	// ---------- student popup ----------

	protected closeModal(): void {
		this.modal.set(null);
	}

	/** Fetches the student and switches the popup to the edit form. */
	protected async openEdit(isuId: number): Promise<void> {
		try {
			const student = await firstValueFrom(this.api.getByIsuId(isuId));
			this.modal.set({ mode: 'edit', student });
		} catch (error) {
			this.alert.error(
				errorMessage(error, 'Не удалось загрузить данные студента для редактирования.'),
			);
		}
	}

	/** "Отмена" in the edit form: back to the (freshly loaded) read-only view. */
	protected async backToView(isuId: number): Promise<void> {
		try {
			const student = await firstValueFrom(this.api.getByIsuId(isuId));
			this.modal.set({ mode: 'view', student });
		} catch (error) {
			this.alert.error(errorMessage(error, 'Не удалось загрузить данные студента.'));
		}
	}

	/** Submits a new student or the edits of an existing one. */
	protected async saveStudent(event: StudentSaveEvent): Promise<void> {
		try {
			if (event.mode === 'add') {
				await firstValueFrom(this.api.create(event.data));
				this.alert.success('Студент успешно добавлен!');
			} else {
				await firstValueFrom(this.api.update(event.isuId, event.data));
				this.alert.success('Данные студента обновлены!');
			}

			this.modal.set(null);
			this.refresh();
		} catch (error) {
			console.error('[Form Submit Error]', error);
			// The popup stays open so the user can correct the data (e.g. duplicate ISU ID).
			this.alert.error(errorMessage(error, 'Ошибка при сохранении данных!'));
		}
	}

	protected async deleteStudent(isuId: number): Promise<void> {
		this.modal.set(null); // the popup closes right away
		try {
			await firstValueFrom(this.api.delete(isuId));
			this.alert.success('Студент успешно удален.');

			this.criteria.update((criteria) => ({
				...criteria,
				pageNumber: pageAfterDeletion(
					criteria.pageNumber,
					this.rowsPerPage,
					this.totalStudents(),
				),
			}));
			this.refresh();
		} catch (error) {
			this.alert.error(errorMessage(error, 'Не удалось удалить студента.'));
		}
	}

	// ---------- data ----------

	private refresh(): void {
		this.refresh$.next();
	}

	private loadPage(): Observable<PagedResponse<Student>> {
		const criteria = this.criteria();
		// Circle (asc -> desc -> off[isuId])
		const hasSort = !!criteria.sortField && !!criteria.sortDirection;

		return this.api
			.search({
				search: criteria.searchKeyword,
				sortBy: hasSort ? criteria.sortField : '',
				sortDirection: hasSort ? criteria.sortDirection : '',
				page: criteria.pageNumber - 1,
				size: this.rowsPerPage,
			})
			.pipe(
				catchError((error: unknown) => {
					console.error('[Refresh View Error]', error);
					this.alert.error(errorMessage(error, CONNECTION_ERROR_MESSAGE));
					return EMPTY; // keep the previous data on screen
				}),
			);
	}

	private syncUrl(): void {
		void this.router.navigate([], {
			relativeTo: this.route,
			queryParams: toQueryParams(this.criteria()),
			queryParamsHandling: 'merge',
			replaceUrl: true,
		});
	}
}
