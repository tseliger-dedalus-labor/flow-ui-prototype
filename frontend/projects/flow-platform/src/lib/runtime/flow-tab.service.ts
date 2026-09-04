import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { FlowNode } from '../models';

/**
 * Beschreibt einen dynamisch zu öffnenden Tab innerhalb eines Flow-Tab-Containers.
 */
export interface FlowTabRequest {
  key: string;
  title: string;
  node: FlowNode;
}

/**
 * Vermittelt Tab-Anfragen von Kindkomponenten an den umgebenden Tab-Container.
 */
@Injectable()
export class FlowTabService {
  private readonly requests = new Subject<FlowTabRequest>();

  /** Beobachtet neue Anforderungen für dynamische Tabs. */
  readonly requests$: Observable<FlowTabRequest> = this.requests.asObservable();

  /**
   * Öffnet einen neuen Tab oder aktiviert einen bereits unter demselben Schlüssel geöffneten Tab.
   */
  open(request: FlowTabRequest): void {
    this.requests.next(request);
  }
}
