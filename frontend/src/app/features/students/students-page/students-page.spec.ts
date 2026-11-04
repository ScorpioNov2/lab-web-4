import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthResponse } from '../../../core/auth/auth.model';
import { AuthService } from '../../../core/auth/auth.service';
import { authInterceptor } from '../../../core/http/auth.interceptor';
import { StorageManager } from '../../../core/storage/storage-manager';
import { AlertService } from '../../../shared/ui/alert/alert.service';
import { AuthModalService } from '../../auth/auth-modal.service';
import { StudentsPage } from './students-page';

const STUDENTS_URL = 'http://localhost:8080/api/students';

const student = (isuId: number) => ({
	fullName: `Студент ${isuId}`,
	groupName: 'K3101',
	isuId,
	dormitoryNumber: 3,
	roomNumber: '305',
	settlementTerm: '2026-09-01',
	foreigner: false,
	notes: '',
});

const pageOf = (isuIds: number[], page: number, totalElements: number) => ({
	content: isuIds.map(student),
	page,
	size: 10,
	totalElements,
	totalPages: Math.ceil(totalElements / 10),
});

const loggedIn: AuthResponse = {
	accessToken: 'token',
	refreshToken: 'refresh',
	tokenType: 'Bearer',
	accessExpiresInSeconds: 900,
	user: null,
};

describe('StudentsPage', () => {
	let controller: HttpTestingController;
	let storage: StorageManager;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				provideHttpClient(withInterceptors([authInterceptor])),
				provideHttpClientTesting(),
			],
		});
		storage = TestBed.inject(StorageManager);
		storage.clearAuth();
		controller = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		controller.verify();
		storage.clearAuth();
	});

	async function open(url = '/'): Promise<ComponentFixture<StudentsPage>> {
		await TestBed.inject(Router).navigateByUrl(url);
		const fixture = TestBed.createComponent(StudentsPage);
		fixture.detectChanges();
		return fixture;
	}

	const searches = () => controller.match((request) => request.url === STUDENTS_URL);
	const text = (fixture: ComponentFixture<StudentsPage>, selector: string) =>
		(fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent?.trim();

	it('loads page 1 on startup and renders the table', async () => {
		storage.saveAuthSession(loggedIn);
		const fixture = await open();

		const [request, ...others] = searches();
		expect(others).toEqual([]);
		expect(request.request.params.get('page')).toBe('0');
		expect(request.request.params.get('size')).toBe('10');
		expect(request.request.headers.get('Authorization')).toBe('Bearer token');
		request.flush(pageOf([1, 2, 3], 0, 3));
		await fixture.whenStable();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(3);
		expect(text(fixture, '.badge-info')).toBe('Всего: 3 студентов');
		expect(TestBed.inject(Router).url).toContain('page=1');
	});

	it('shows the login hint to a guest whose request is rejected', async () => {
		const fixture = await open();

		searches()[0].flush(
			{ message: 'Unauthorized' },
			{ status: 401, statusText: 'Unauthorized' },
		);
		await fixture.whenStable();
		fixture.detectChanges();

		expect(TestBed.inject(AlertService).toasts()[0]).toMatchObject({
			message: 'Unauthorized',
			type: 'error',
		});
		expect(fixture.nativeElement.querySelector('table')).toBeNull();
		expect(text(fixture, '.empty-text')).toBe('Здесь пока ничего нет!');

		fixture.nativeElement.querySelector('.btn-empty-login').click();
		expect(TestBed.inject(AuthModalService).mode()).toBe('login');
	});

	it('says so when the search has no results', async () => {
		storage.saveAuthSession(loggedIn);
		const fixture = await open();
		searches()[0].flush(pageOf([], 0, 0));
		await fixture.whenStable();
		fixture.detectChanges();

		expect(text(fixture, '.no-results')).toBe('Список пуст или результаты не найдены.');
	});

	it('restores search, sort and page from the URL', async () => {
		storage.saveAuthSession(loggedIn);
		await open('/?search=%D0%98%D0%B2&sort=isuId&direction=desc&page=2');

		const params = searches()[0].request.params;
		expect(params.get('search')).toBe('Ив');
		expect(params.get('sortBy')).toBe('isuId');
		expect(params.get('sortDirection')).toBe('desc');
		expect(params.get('page')).toBe('1');
	});

	it('searches from the first page', async () => {
		storage.saveAuthSession(loggedIn);
		const fixture = await open('/?page=3');
		searches()[0].flush(pageOf([1], 2, 25));
		await fixture.whenStable();
		fixture.detectChanges();

		const input: HTMLInputElement = fixture.nativeElement.querySelector('.search-box input');
		input.value = 'Пет';
		input.dispatchEvent(new Event('input'));

		const { params } = searches()[0].request;
		expect(params.get('search')).toBe('Пет');
		expect(params.get('page')).toBe('0');
	});

	it('cycles the sort asc -> desc -> off on clicks of a column header', async () => {
		storage.saveAuthSession(loggedIn);
		const fixture = await open();
		searches()[0].flush(pageOf([1, 2], 0, 2));
		await fixture.whenStable();
		fixture.detectChanges();

		const header = () =>
			(fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('thead th')!;
		const clickAndRead = (): [string | null, string | null] => {
			header().click();
			const { params } = searches()[0].request;
			return [params.get('sortBy'), params.get('sortDirection')];
		};

		expect(clickAndRead()).toEqual(['fullName', 'asc']);
		expect(clickAndRead()).toEqual(['fullName', 'desc']);
		expect(clickAndRead()).toEqual([null, null]);
	});

	it('selects a row on click and drops the selection when clicking outside the table', async () => {
		storage.saveAuthSession(loggedIn);
		const fixture = await open();
		searches()[0].flush(pageOf([7, 8], 0, 2));
		await fixture.whenStable();
		fixture.detectChanges();

		const root: HTMLElement = fixture.nativeElement;
		const buttons = () =>
			Array.from(root.querySelectorAll<HTMLButtonElement>('.action-buttons button'));
		expect(buttons().map((button) => button.disabled)).toEqual([false, true, true]);

		root.querySelectorAll<HTMLElement>('tbody tr')[1].click();
		fixture.detectChanges();
		expect(root.querySelector('tr.focused-row td:nth-child(3)')?.textContent).toBe('8');
		expect(buttons().map((button) => button.disabled)).toEqual([false, false, false]);

		document.body.click();
		fixture.detectChanges();
		expect(root.querySelector('tr.focused-row')).toBeNull();
		expect(buttons()[1].disabled).toBe(true);
	});

	it('goes back one page after deleting the only student of the last page', async () => {
		storage.saveAuthSession(loggedIn);
		const fixture = await open('/?page=2');
		searches()[0].flush(pageOf([11], 1, 11));
		await fixture.whenStable();
		fixture.detectChanges();

		const deleted = (
			fixture.componentInstance as unknown as { deleteStudent(id: number): Promise<void> }
		).deleteStudent(11);
		controller
			.expectOne(`${STUDENTS_URL}/11`)
			.flush(null, { status: 204, statusText: 'No Content' });
		await deleted;

		expect(
			TestBed.inject(AlertService)
				.toasts()
				.map((toast) => toast.message),
		).toContain('Студент успешно удален.');
		const reload = searches()[0].request;
		expect(reload.params.get('page')).toBe('0');
	});

	it('forgets the loaded data on logout', async () => {
		storage.saveAuthSession(loggedIn);
		const fixture = await open();
		searches()[0].flush(pageOf([1, 2], 0, 2));
		await fixture.whenStable();
		fixture.detectChanges();
		expect(fixture.nativeElement.querySelector('table')).not.toBeNull();

		TestBed.inject(AuthService).logout();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('table')).toBeNull();
		expect(text(fixture, '.empty-text')).toBe('Здесь пока ничего нет!');
		expect(text(fixture, '.badge-info')).toBe('Всего: 0 студентов');
		controller.expectNone((request) => request.url === STUDENTS_URL);
	});
});
