import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';

describe('AlertService', () => {
	let alerts: AlertService;

	beforeEach(() => {
		vi.useFakeTimers();
		alerts = TestBed.inject(AlertService);
	});

	afterEach(() => vi.useRealTimers());

	it('shows a toast, fades it out after 4 s and then removes it', () => {
		alerts.success('Готово');
		expect(alerts.toasts()).toMatchObject([
			{ message: 'Готово', type: 'success', leaving: false },
		]);

		vi.advanceTimersByTime(3999);
		expect(alerts.toasts()[0].leaving).toBe(false);
		vi.advanceTimersByTime(1);
		expect(alerts.toasts()[0].leaving).toBe(true);

		vi.advanceTimersByTime(300);
		expect(alerts.toasts()).toEqual([]);
	});

	it('closes a toast on demand, only once', () => {
		alerts.error('Ошибка');
		alerts.info('Инфо');
		const [first] = alerts.toasts();

		alerts.dismiss(first.id);
		alerts.dismiss(first.id);
		expect(alerts.toasts().map((toast) => toast.leaving)).toEqual([true, false]);

		vi.advanceTimersByTime(300);
		expect(alerts.toasts().map((toast) => toast.message)).toEqual(['Инфо']);
	});
});
