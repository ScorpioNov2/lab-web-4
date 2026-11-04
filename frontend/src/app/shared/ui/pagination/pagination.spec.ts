import { TestBed } from '@angular/core/testing';
import { generatePaginationRange, Pagination } from './pagination';

describe('generatePaginationRange', () => {
	it('lists every page when there are at most 7', () => {
		expect(generatePaginationRange(1, 1)).toEqual([1]);
		expect(generatePaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it('shows the first five pages, a gap and the last one near the start', () => {
		expect(generatePaginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, '...', 10]);
		expect(generatePaginationRange(4, 10)).toEqual([1, 2, 3, 4, 5, '...', 10]);
	});

	it('shows the first page, a gap and the last five pages near the end', () => {
		expect(generatePaginationRange(10, 10)).toEqual([1, '...', 6, 7, 8, 9, 10]);
		expect(generatePaginationRange(8, 10)).toEqual([1, '...', 6, 7, 8, 9, 10]);
	});

	it('shows the neighbours of the current page in the middle', () => {
		expect(generatePaginationRange(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
	});
});

describe('Pagination', () => {
	function setup(currentPage: number, totalPages: number) {
		const fixture = TestBed.createComponent(Pagination);
		fixture.componentRef.setInput('currentPage', currentPage);
		fixture.componentRef.setInput('totalPages', totalPages);
		const emitted: number[] = [];
		fixture.componentInstance.pageChange.subscribe((page) => emitted.push(page));
		fixture.detectChanges();
		const root = fixture.nativeElement as HTMLElement;
		return { root, emitted, buttons: () => Array.from(root.querySelectorAll('button')) };
	}

	it('renders nothing for a single page', () => {
		expect(setup(1, 1).root.querySelector('ul')).toBeNull();
	});

	it('disables prev on the first page and next on the last', () => {
		const first = setup(1, 3).buttons();
		expect(first[0].disabled).toBe(true);
		expect(first[first.length - 1].disabled).toBe(false);

		const last = setup(3, 3).buttons();
		expect(last[0].disabled).toBe(false);
		expect(last[last.length - 1].disabled).toBe(true);
	});

	it('marks the current page and emits the clicked one', () => {
		const { root, emitted, buttons } = setup(2, 5);
		expect(root.querySelector('.pagination-item.active')?.textContent?.trim()).toBe('2');

		buttons()
			.find((button) => button.textContent?.trim() === '4')
			?.click();
		buttons()[0].click(); // prev
		buttons()[buttons().length - 1].click(); // next
		expect(emitted).toEqual([4, 1, 3]);
	});
});
