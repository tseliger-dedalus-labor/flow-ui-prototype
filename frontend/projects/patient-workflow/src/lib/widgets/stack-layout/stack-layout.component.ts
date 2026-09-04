import { Component } from '@angular/core';
import { AContentPresenter } from 'ui-framework';

/**
 * Minimaler Container, der gestapelte Kindknoten optisch zusammenfasst.
 */
@Component({
  selector: 'app-stack-layout',
  standalone: true,
  templateUrl: './stack-layout.component.html',
  styleUrl: './stack-layout.component.scss'
})
export class StackLayoutComponent extends AContentPresenter {
  constructor() {
    super('WebclientTool');
  }
}
