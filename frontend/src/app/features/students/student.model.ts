import { asBoolean, asDate, asNumber, asString } from '../../core/models/coerce';

/** What the UI works with (dates are real Date objects, nothing is ever null/undefined). */
export interface Student {
	fullName: string;
	groupName: string;
	isuId: number; // int64, the only identifier of a student
	dormitoryNumber: number; // int32
	roomNumber: string;
	settlementTerm: Date | null; // cast to Date for intuitive frontend display
	foreigner: boolean;
	notes: string;
	createdAt: Date | null;
}

/** Raw shape as it arrives from the backend (every field may be missing). */
export type StudentDto = Partial<Record<keyof Student, unknown>>;

export function toStudent(dto: StudentDto): Student {
	return {
		fullName: asString(dto.fullName),
		groupName: asString(dto.groupName),
		isuId: asNumber(dto.isuId),
		dormitoryNumber: asNumber(dto.dormitoryNumber),
		roomNumber: asString(dto.roomNumber),
		settlementTerm: asDate(dto.settlementTerm),
		foreigner: asBoolean(dto.foreigner),
		notes: asString(dto.notes),
		createdAt: asDate(dto.createdAt),
	};
}

/**
 * Body of POST /students and PATCH /students/{isuId} (and what the popup form produces).
 * Swagger constraints:
 *  fullName       [0, 255] characters, no digits (^[^\p{N}]*$)
 *  groupName      [0, 100] characters
 *  isuId          > 0, int64
 *  dormitoryNumber > 0, int32
 *  roomNumber     [0, 50] characters
 *  settlementTerm date (YYYY-MM-DD)
 *  notes          [0, 4000] characters
 */
export interface StudentPayload {
	fullName: string;
	groupName: string;
	isuId: number;
	dormitoryNumber: number;
	roomNumber: string;
	settlementTerm: string;
	foreigner: boolean;
	notes: string;
}

/** Query of GET /students. Empty values are not sent. */
export interface StudentSearchRequest {
	search?: string; // [0, 255] characters
	fullName?: string; // [0, 255] characters
	groupName?: string; // [0, 100] characters
	isuId?: number | null; // > 0, int64
	dormitoryNumber?: number | null; // ≥ 1, int32
	foreigner?: boolean | null;
	page?: number; // Default: 0
	size?: number; // Default: 20
	/** isuId|fullName|groupName|dormitoryNumber|roomNumber|settlementTerm; empty = no sort (natural DB order) */
	sortBy?: string;
	/** asc|desc, only meaningful together with sortBy */
	sortDirection?: string;
}
