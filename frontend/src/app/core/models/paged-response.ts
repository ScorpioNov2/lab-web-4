import { asNumber } from './coerce';

/** Mirrors Java's PagedResponse<T>. */
export interface PagedResponse<T> {
	content: T[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

export interface PagedResponseDto<TDto> {
	content?: TDto[] | null;
	page?: number | null;
	size?: number | null;
	totalElements?: number | null;
	totalPages?: number | null;
}

export function toPagedResponse<TDto, T>(
	dto: PagedResponseDto<TDto> | null | undefined,
	mapItem: (item: TDto) => T,
): PagedResponse<T> {
	return {
		content: Array.from(dto?.content ?? []).map(mapItem),
		page: asNumber(dto?.page),
		size: asNumber(dto?.size),
		totalElements: asNumber(dto?.totalElements),
		totalPages: asNumber(dto?.totalPages),
	};
}
