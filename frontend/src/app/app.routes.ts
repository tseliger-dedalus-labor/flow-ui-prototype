import { Routes } from '@angular/router';
import { RuntimePageComponent } from './pages/runtime-page.component';
import { EditorPageComponent } from './pages/editor-page.component';

export const routes: Routes = [
  { path: '', component: RuntimePageComponent },
  { path: 'editor', component: EditorPageComponent }
];
