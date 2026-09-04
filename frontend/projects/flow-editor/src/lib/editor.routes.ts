import { Routes } from '@angular/router';
import { EditorPageComponent } from './editor-page/editor-page.component';

/**
 * Stellt den Editor als eigenständige Lazy-Route bereit.
 */
export const EDITOR_ROUTES: Routes = [
  { path: '', component: EditorPageComponent }
];
