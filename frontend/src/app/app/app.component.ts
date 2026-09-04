import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root-Komponente, die ausschließlich den globalen Router-Auslass bereitstellt.
 */
@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {}
