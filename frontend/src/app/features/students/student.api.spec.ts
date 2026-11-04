import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StudentApi, toSearchParams } from './student.api';
import { toStudent } from './student.model';

const BASE = 'http://localhost:8080/api/students';

describe('StudentApi', () => {
	describe('toSearchParams', () => {
		it('skips empty values and keeps page 0', () => {
			expect(
				toSearchParams({
					search: '',
					sortBy: '',
					sortDirection: '',
					page: 0,
					size: 10,
				}).toString(),
			).toBe('page=0&size=10');
		});

		it('sends every non-empty value, in the order of the API', () => {
			const params = toSearchParams({
				search: 'ив',
				sortBy: 'fullName',
				sortDirection: 'asc',
				page: 2,
				size: 10,
				foreigner: false,
			});
			expect(params.toString()).toBe(
				`search=${encodeURIComponent('ив')}&foreigner=false&page=2&size=10&sortBy=fullName&sortDirection=asc`,
			);
		});

		it('defaults to page 0, size 20', () => {
			expect(toSearchParams({}).toString()).toBe('page=0&size=20');
		});
	});

	describe('toStudent', () => {
		it('fills safe defaults for missing fields and casts the dates', () => {
			expect(toStudent({})).toEqual({
				fullName: '',
				groupName: '',
				isuId: 0,
				dormitoryNumber: 0,
				roomNumber: '',
				settlementTerm: null,
				foreigner: false,
				notes: '',
				createdAt: null,
			});

			const student = toStudent({
				isuId: '123456',
				settlementTerm: '2026-09-01',
				notes: null,
			});
			expect(student.isuId).toBe(123456);
			expect(student.settlementTerm).toEqual(new Date('2026-09-01'));
			expect(student.notes).toBe('');
		});
	});

	describe('requests', () => {
		let api: StudentApi;
		let controller: HttpTestingController;

		beforeEach(() => {
			TestBed.configureTestingModule({
				providers: [provideHttpClient(), provideHttpClientTesting()],
			});
			api = TestBed.inject(StudentApi);
			controller = TestBed.inject(HttpTestingController);
		});

		afterEach(() => controller.verify());

		it('maps the paged response', () => {
			let page: unknown;
			api.search({ page: 1, size: 10 }).subscribe((value) => (page = value));

			const request = controller.expectOne((r) => r.url === BASE);
			expect(request.request.params.get('page')).toBe('1');
			request.flush({
				content: [{ fullName: 'Иван Петров', isuId: 1, settlementTerm: '2026-09-01' }],
				page: 1,
				size: 10,
				totalElements: 11,
				totalPages: 2,
			});

			expect(page).toMatchObject({ page: 1, size: 10, totalElements: 11, totalPages: 2 });
			expect((page as { content: { fullName: string }[] }).content[0].fullName).toBe(
				'Иван Петров',
			);
		});

		it('PATCHes the CURRENT isuId and sends only the known fields', () => {
			api.update(5, {
				fullName: 'A',
				groupName: 'G',
				isuId: 6,
				dormitoryNumber: 1,
				roomNumber: '10',
				settlementTerm: '2026-09-01',
				foreigner: true,
				notes: '',
				extra: 'dropped',
			} as never).subscribe();

			const request = controller.expectOne(`${BASE}/5`);
			expect(request.request.method).toBe('PATCH');
			expect(request.request.body).toEqual({
				fullName: 'A',
				groupName: 'G',
				isuId: 6,
				dormitoryNumber: 1,
				roomNumber: '10',
				settlementTerm: '2026-09-01',
				foreigner: true,
				notes: '',
			});
			request.flush({});
		});

		it('DELETE accepts an empty 204 answer', () => {
			let done = false;
			api.delete(7).subscribe(() => (done = true));
			controller
				.expectOne(`${BASE}/7`)
				.flush(null, { status: 204, statusText: 'No Content' });
			expect(done).toBe(true);
		});
	});
});
