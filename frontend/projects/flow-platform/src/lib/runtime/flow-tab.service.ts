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
   * Meldet dem umgebenden Tab-Container eine Anforderung zum Öffnen oder Aktivieren eines Tabs.
   */
  open(request: FlowTabRequest): void {
    this.requests.next(request);
  }
}
