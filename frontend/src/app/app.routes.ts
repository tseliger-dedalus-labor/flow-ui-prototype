import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'runtime' },
      {
        path: 'runtime',
        loadChildren: () => import('patient-workflow').then((module) => module.USER_UI_ROUTES)
      },
      {
        path: 'appointments',
        loadChildren: () => import('appointments').then((module) => module.APPOINTMENTS_ROUTES)
      },
      {
        path: 'editor',
        loadChildren: () => import('flow-editor').then((module) => module.EDITOR_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'runtime' }
];
