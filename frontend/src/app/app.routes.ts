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
        loadChildren: () => import('./modules/user-ui/user-ui.routes').then((module) => module.USER_UI_ROUTES)
      },
      {
        path: 'appointments',
        loadChildren: () => import('./modules/appointments/appointments.routes').then((module) => module.APPOINTMENTS_ROUTES)
      },
      {
        path: 'editor',
        loadChildren: () => import('./modules/editor/editor.routes').then((module) => module.EDITOR_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'runtime' }
];
