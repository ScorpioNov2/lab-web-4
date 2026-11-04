import { TestBed } from '@angular/core/testing';
import { WelcomePigeon } from './welcome-pigeon';
import { WelcomePigeonService } from './welcome-pigeon.service';

describe('WelcomePigeon', () => {
	async function setup() {
		const fixture = TestBed.createComponent(WelcomePigeon);
		const service = TestBed.inject(WelcomePigeonService);
		const settle = async () => {
			fixture.detectChanges();
			await fixture.whenStable();
			fixture.detectChanges();
		};
		await settle();
		return { fixture, service, settle, root: fixture.nativeElement as HTMLElement };
	}

	it('shows nothing until a flight is requested', async () => {
		const { root } = await setup();
		expect(root.querySelector('.pigeon-flyer')).toBeNull();
	});

	it('flies a pigeon with the greeting sign, and lands when the animation ends', async () => {
		const { root, service, settle } = await setup();

		service.fly('  Иван   Иванов ');
		await settle();

		const flyer = root.querySelector<HTMLElement>('.pigeon-flyer')!;
		expect(flyer.classList.contains('is-flying')).toBe(true);
		expect(flyer.classList.contains('is-custom')).toBe(false);
		expect(root.querySelector('.pigeon-board')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'Welcome Иван Иванов to the system',
		);
		const parts = Array.from(root.querySelectorAll('.pigeon-bird svg, .pigeon-bird svg *'));
		expect(parts.length).toBeGreaterThan(5);
		expect(parts.every((part) => part.namespaceURI === 'http://www.w3.org/2000/svg')).toBe(
			true,
		);
		expect(
			root.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'clipPath').length,
		).toBeGreaterThan(0);
		expect(flyer.style.getPropertyValue('--pigeon-duration')).toMatch(/^\d+(\.\d+)?s$/);

		// an animation of an inner part must not end the flight
		root.querySelector('.pigeon-bird')!.dispatchEvent(
			new Event('animationend', { bubbles: true }),
		);
		await settle();
		expect(root.querySelector('.pigeon-flyer')).not.toBeNull();

		flyer.dispatchEvent(new Event('animationend'));
		await settle();
		expect(root.querySelector('.pigeon-flyer')).toBeNull();
		expect(service.request()).toBeNull();
	});

	it('replaces a running flight with a new one', async () => {
		const { root, service, settle } = await setup();

		service.fly('Первый');
		await settle();
		const first = root.querySelector('.pigeon-flyer');

		service.fly('Второй');
		await settle();
		const second = root.querySelector('.pigeon-flyer');

		expect(second).not.toBe(first); // rebuilt, so the animation restarts
		expect(root.querySelector('.pigeon-board-name')?.textContent).toBe('Второй');
		expect(root.querySelectorAll('.pigeon-flyer')).toHaveLength(1);
	});
});
