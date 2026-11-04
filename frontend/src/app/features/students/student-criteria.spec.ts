import { convertToParamMap } from '@angular/router';
import {
	DEFAULT_CRITERIA,
	nextSort,
	pageAfterDeletion,
	readCriteria,
	toQueryParams,
} from './student-criteria';

describe('student criteria', () => {
	describe('readCriteria', () => {
		it('uses the defaults for an empty URL', () => {
			expect(readCriteria(convertToParamMap({}))).toEqual(DEFAULT_CRITERIA);
		});

		it('reads search, sort, direction and page from the URL', () => {
			const criteria = readCriteria(
				convertToParamMap({ search: 'Иван', sort: 'isuId', direction: 'desc', page: '3' }),
			);
			expect(criteria).toEqual({
				searchKeyword: 'Иван',
				sortField: 'isuId',
				sortDirection: 'desc',
				pageNumber: 3,
			});
		});

		it('falls back to page 1 / asc for garbage values', () => {
			const criteria = readCriteria(convertToParamMap({ page: '-4', direction: 'sideways' }));
			expect(criteria.pageNumber).toBe(1);
			expect(criteria.sortDirection).toBe('asc');
			expect(readCriteria(convertToParamMap({ page: 'abc' })).pageNumber).toBe(1);
		});
	});

	describe('toQueryParams', () => {
		it('always writes the page and drops empty search / sort', () => {
			expect(toQueryParams({ ...DEFAULT_CRITERIA, pageNumber: 2 })).toEqual({
				page: 2,
				search: null,
				sort: null,
				direction: null,
			});
		});

		it('writes the trimmed search and the sort when both field and direction are set', () => {
			expect(
				toQueryParams({
					searchKeyword: '  Петров ',
					sortField: 'fullName',
					sortDirection: 'desc',
					pageNumber: 1,
				}),
			).toEqual({ page: 1, search: 'Петров', sort: 'fullName', direction: 'desc' });
		});

		it('drops the sort once the direction cycled back to off', () => {
			const params = toQueryParams({
				...DEFAULT_CRITERIA,
				sortField: 'isuId',
				sortDirection: '',
			});
			expect(params['sort']).toBeNull();
			expect(params['direction']).toBeNull();
		});
	});

	describe('nextSort', () => {
		it('cycles asc -> desc -> off -> asc on the same column', () => {
			let state = nextSort({ sortField: '', sortDirection: '' }, 'fullName');
			expect(state).toEqual({ sortField: 'fullName', sortDirection: 'asc' });
			state = nextSort(state, 'fullName');
			expect(state.sortDirection).toBe('desc');
			state = nextSort(state, 'fullName');
			expect(state.sortDirection).toBe('');
			state = nextSort(state, 'fullName');
			expect(state.sortDirection).toBe('asc');
		});

		it('starts a different column at asc', () => {
			expect(nextSort({ sortField: 'fullName', sortDirection: 'desc' }, 'isuId')).toEqual({
				sortField: 'isuId',
				sortDirection: 'asc',
			});
		});
	});

	describe('pageAfterDeletion', () => {
		it('steps back when the only student of the last page was deleted', () => {
			// 11 students, 10 per page: page 2 holds only one
			expect(pageAfterDeletion(2, 10, 11)).toBe(1);
		});

		it('stays when the page still has other students', () => {
			expect(pageAfterDeletion(2, 10, 12)).toBe(2);
			expect(pageAfterDeletion(1, 10, 11)).toBe(1);
		});

		it('never goes below page 1 and ignores the last remaining student', () => {
			expect(pageAfterDeletion(1, 10, 1)).toBe(1);
			expect(pageAfterDeletion(1, 10, 0)).toBe(1);
		});
	});
});
