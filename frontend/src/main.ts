import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app/app.component';

/**
 * Startet die Standalone-Anwendung mit der zentralen Laufzeitkonfiguration.
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
