import { ParamMap, Params } from '@angular/router';

export type SortDirection = 'asc' | 'desc' | '';

/** Everything that defines which students the table shows. Mirrored into the URL query. */
export interface StudentCriteria {
	searchKeyword: string;
	sortField: string;
	/** Circle: asc -> desc -> '' (off) */
	sortDirection: SortDirection;
	/** 1-based */
	pageNumber: number;
}

export const DEFAULT_CRITERIA: StudentCriteria = {
	searchKeyword: '',
	sortField: '',
	sortDirection: 'asc',
	pageNumber: 1,
};

/** Read the entire criteria from the URL query (was UrlStateManager.loadCriteriaFromUrl). */
export function readCriteria(params: ParamMap): StudentCriteria {
	const direction = params.get('direction');
	const page = Math.floor(Number(params.get('page')));

	return {
		searchKeyword: params.get('search') ?? DEFAULT_CRITERIA.searchKeyword,
		sortField: params.get('sort') ?? DEFAULT_CRITERIA.sortField,
		sortDirection:
			direction === 'asc' || direction === 'desc'
				? direction
				: DEFAULT_CRITERIA.sortDirection,
		pageNumber: page >= 1 ? page : DEFAULT_CRITERIA.pageNumber,
	};
}

/** Query params for the URL; `null` removes a param (was UrlStateManager.saveCriteriaToUrl). */
export function toQueryParams(criteria: StudentCriteria): Params {
	const hasSort = !!criteria.sortField && !!criteria.sortDirection;
	return {
		page: criteria.pageNumber,
		search: criteria.searchKeyword.trim() || null,
		sort: hasSort ? criteria.sortField : null,
		direction: hasSort ? criteria.sortDirection : null,
	};
}

/** Click on a column header: asc -> desc -> off; a different column starts at asc. */
export function nextSort(
	current: Pick<StudentCriteria, 'sortField' | 'sortDirection'>,
	field: string,
): Pick<StudentCriteria, 'sortField' | 'sortDirection'> {
	if (current.sortField !== field) {
		return { sortField: field, sortDirection: 'asc' };
	}
	const sortDirection: SortDirection =
		current.sortDirection === 'asc' ? 'desc' : current.sortDirection === 'desc' ? '' : 'asc';
	return { sortField: field, sortDirection };
}

/**
 * Page to show after a student was deleted: when the deleted student was the only one on the
 * last page, step back one page so the table does not end up empty.
 */
export function pageAfterDeletion(
	currentPage: number,
	rowsPerPage: number,
	totalBeforeDeletion: number,
): number {
	const firstRowIndexOnPage = (currentPage - 1) * rowsPerPage;
	if (totalBeforeDeletion > 1 && firstRowIndexOnPage >= totalBeforeDeletion - 1) {
		return Math.max(1, currentPage - 1);
	}
	return currentPage;
}
