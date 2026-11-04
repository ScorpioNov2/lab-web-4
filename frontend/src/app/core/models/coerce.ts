/**
 * Tiny casting helpers that replace the runtime schema casting of the old BaseModel:
 * a missing (null/undefined) value becomes a safe default, anything else is converted.
 */
export const asString = (value: unknown, fallback = ''): string =>
	value === null || value === undefined ? fallback : String(value);

export const asNumber = (value: unknown, fallback = 0): number =>
	value === null || value === undefined ? fallback : Number(value);

export const asBoolean = (value: unknown, fallback = false): boolean =>
	value === null || value === undefined ? fallback : Boolean(value);

export const asDate = (value: unknown): Date | null =>
	value === null || value === undefined ? null : new Date(value as string | number | Date);
