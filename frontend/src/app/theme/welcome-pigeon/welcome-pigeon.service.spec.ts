import { formatName } from './welcome-pigeon.service';

describe('formatName', () => {
	it('tidies up whitespace', () => {
		expect(formatName('  Иван   Иванов \n')).toBe('Иван Иванов');
	});

	it('copes with missing names', () => {
		expect(formatName(null)).toBe('');
		expect(formatName(undefined)).toBe('');
	});

	it('caps the name at 50 characters, the last one becoming an ellipsis', () => {
		const name = formatName('Я'.repeat(80));
		expect(Array.from(name)).toHaveLength(50);
		expect(name.endsWith('…')).toBe(true);
		expect(formatName('Я'.repeat(50))).toBe('Я'.repeat(50));
	});

	it('counts real characters, not UTF-16 units', () => {
		const name = formatName('😀'.repeat(60));
		expect(Array.from(name)).toHaveLength(50);
	});
});
