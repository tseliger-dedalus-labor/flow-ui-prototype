import { Tool } from './tool';

/**
 * Gemeinsamer Zustand aller Presenter.
 */
export abstract class APresenter {
  loading = false;
  visible = true;

  protected constructor(public readonly tool: Tool) {}
}

/**
 * Basis für Presenter im Hauptbereich.
 */
export abstract class AContentPresenter extends APresenter {}

/**
 * Basis für Presenter in der Sidebar.
 */
export abstract class ASidebarPresenter extends APresenter {}
