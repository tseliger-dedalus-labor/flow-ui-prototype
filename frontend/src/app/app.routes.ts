import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component/shell.component';

/**
 * Komponiert die Shell und lädt die fachlichen Bereiche erst bei Bedarf nach.
 */
export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'runtime' },
      {
        path: 'runtime',
        // Die Benutzeroberfläche für Flows lebt als eigenständige Bibliothek und bleibt dadurch entkoppelt.
        loadChildren: () => import('patient-workflow').then((module) => module.USER_UI_ROUTES)
      },
      {
        path: 'appointments',
        // Die Terminplanung erweitert die Runtime um zusätzliche Widgets und einen eigenen Einstiegspunkt.
        loadChildren: () => import('appointments').then((module) => module.APPOINTMENTS_ROUTES)
      },
      {
        path: 'editor',
        // Der Editor wird separat geladen, damit Produktionspfade keine Authoring-Abhängigkeiten mitziehen.
        loadChildren: () => import('flow-editor').then((module) => module.EDITOR_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'runtime' }
];
