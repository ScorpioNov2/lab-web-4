import { asNumber, asString } from '../models/coerce';

// --- REQUESTS (Swagger Spec) ---

export interface LoginRequest {
	loginIdentifier: string; // [0, 255] characters
	password: string; // [0, 72] characters
}

export interface RegisterRequest {
	fullName: string; // [0, 255] characters
	username: string; // [5, 20] characters, matches: ^[a-zA-Z0-9][a-zA-Z0-9_-]{3,18}[a-zA-Z0-9]$
	email: string; // email, [0, 255] characters
	password: string; // [8, 72] characters
	passwordConfirm: string; // ≥ 1 characters
}

export interface RefreshTokenRequest {
	refreshToken: string; // ≥ 1 characters
}

// --- RESPONSES (Swagger Spec) ---

export interface User {
	id: number; // int64
	fullName: string;
	username: string;
	email: string;
	role: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
	accessExpiresInSeconds: number; // int64
	user: User | null;
}

/** Raw shapes as they arrive from the backend (every field may be missing). */
export type UserDto = Partial<Record<keyof User, unknown>>;
export type AuthResponseDto = Partial<Record<Exclude<keyof AuthResponse, 'user'>, unknown>> & {
	user?: UserDto | null;
};

export function toUser(dto: UserDto): User {
	return {
		id: asNumber(dto.id),
		fullName: asString(dto.fullName),
		username: asString(dto.username),
		email: asString(dto.email),
		role: asString(dto.role),
	};
}

export function toAuthResponse(dto: AuthResponseDto): AuthResponse {
	return {
		accessToken: asString(dto.accessToken),
		refreshToken: asString(dto.refreshToken),
		tokenType: asString(dto.tokenType),
		accessExpiresInSeconds: asNumber(dto.accessExpiresInSeconds),
		user: dto.user ? toUser(dto.user) : null,
	};
}
