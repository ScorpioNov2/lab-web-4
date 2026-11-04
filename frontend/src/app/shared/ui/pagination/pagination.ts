import { Component, computed, input, output } from '@angular/core';

export type PageItem = number | '...';

const TOTAL_NUMBERS = 7;

/** Page numbers (and "..." gaps) to show for the current position. */
export function generatePaginationRange(currentPage: number, totalPages: number): PageItem[] {
	if (totalPages <= TOTAL_NUMBERS) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const showLeftDots = currentPage > 4;
	const showRightDots = currentPage < totalPages - 3;

	if (!showLeftDots && showRightDots) {
		return [1, 2, 3, 4, 5, '...', totalPages];
	}

	if (showLeftDots && !showRightDots) {
		const rightRange = Array.from({ length: 5 }, (_, i) => totalPages - 5 + i + 1);
		return [1, '...', ...rightRange];
	}

	return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

@Component({
	selector: 'app-pagination',
	templateUrl: './pagination.html',
	styleUrl: './pagination.scss',
})
export class Pagination {
	readonly currentPage = input.required<number>();
	readonly totalPages = input.required<number>();

	readonly pageChange = output<number>();

	protected readonly range = computed(() =>
		generatePaginationRange(this.currentPage(), this.totalPages()),
	);

	protected goTo(page: number): void {
		if (page >= 1 && page <= this.totalPages()) {
			this.pageChange.emit(page);
		}
	}
}
