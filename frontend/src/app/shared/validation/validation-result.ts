export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

export function toValidationResult(errors: string[]): ValidationResult {
	return { isValid: errors.length === 0, errors };
}
