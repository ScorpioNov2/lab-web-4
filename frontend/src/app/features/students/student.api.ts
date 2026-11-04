import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { PagedResponse, PagedResponseDto, toPagedResponse } from '../../core/models/paged-response';
import {
	Student,
	StudentDto,
	StudentPayload,
	StudentSearchRequest,
	toStudent,
} from './student.model';

/** (?page=0&size=20...) - skips null/undefined/empty values, same as the old toQueryString(). */
export function toSearchParams(request: StudentSearchRequest): HttpParams {
	const query: Record<string, unknown> = {
		search: request.search,
		fullName: request.fullName,
		groupName: request.groupName,
		isuId: request.isuId,
		dormitoryNumber: request.dormitoryNumber,
		foreigner: request.foreigner,
		page: request.page ?? 0,
		size: request.size ?? 20,
		sortBy: request.sortBy,
		sortDirection: request.sortDirection,
	};

	let params = new HttpParams();
	for (const [key, value] of Object.entries(query)) {
		if (value !== null && value !== undefined && value !== '') {
			params = params.set(key, String(value));
		}
	}
	return params;
}

/** Only the known fields go over the wire. */
function toPayload(data: StudentPayload): StudentPayload {
	return {
		fullName: data.fullName,
		groupName: data.groupName,
		isuId: data.isuId,
		dormitoryNumber: data.dormitoryNumber,
		roomNumber: data.roomNumber,
		settlementTerm: data.settlementTerm,
		foreigner: data.foreigner,
		notes: data.notes,
	};
}

@Injectable({ providedIn: 'root' })
export class StudentApi {
	private readonly http = inject(HttpClient);
	private readonly url = `${inject(API_BASE_URL)}/students`;

	/** Получить список студентов (GET с пагинацией и фильтрами) */
	search(request: StudentSearchRequest): Observable<PagedResponse<Student>> {
		return this.http
			.get<PagedResponseDto<StudentDto>>(this.url, { params: toSearchParams(request) })
			.pipe(map((dto) => toPagedResponse(dto, toStudent)));
	}

	/** Получить детальную информацию о студенте по ISU ID (GET) */
	getByIsuId(isuId: number): Observable<Student> {
		return this.http.get<StudentDto>(`${this.url}/${isuId}`).pipe(map(toStudent));
	}

	/** Создать нового студента (POST) */
	create(data: StudentPayload): Observable<Student> {
		return this.http.post<StudentDto>(this.url, toPayload(data)).pipe(map(toStudent));
	}

	/**
	 * Обновить информацию о студенте по ISU ID (PATCH)
	 * @param isuId ТЕКУЩИЙ ISU ID студента (в data.isuId может прийти новый)
	 */
	update(isuId: number, data: StudentPayload): Observable<Student> {
		return this.http
			.patch<StudentDto>(`${this.url}/${isuId}`, toPayload(data))
			.pipe(map(toStudent));
	}

	/** Удалить студента по ISU ID (DELETE) */
	delete(isuId: number): Observable<void> {
		return this.http.delete<void>(`${this.url}/${isuId}`);
	}
}
