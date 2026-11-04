import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
		});
	});

	it('renders the header, the themed frame and the routed screen outlet', async () => {
		const fixture = TestBed.createComponent(App);
		await fixture.whenStable();
		const root: HTMLElement = fixture.nativeElement;

		expect(root.querySelector('.header-title')?.textContent).toContain(
			'Система Заявок Студентов',
		);
		expect(root.querySelector('main.main-content router-outlet')).not.toBeNull();
		// guest: login + registration buttons
		expect(
			Array.from(root.querySelectorAll('.header-auth button')).map((b) =>
				b.textContent?.trim(),
			),
		).toEqual(['Вход', 'Регистрация']);
	});
});
