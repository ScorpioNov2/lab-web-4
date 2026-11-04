import { Routes } from '@angular/router';
import { StudentsPage } from './features/students/students-page/students-page';

export const routes: Routes = [
	{ path: '', component: StudentsPage },
	{ path: '**', redirectTo: '' },
];
