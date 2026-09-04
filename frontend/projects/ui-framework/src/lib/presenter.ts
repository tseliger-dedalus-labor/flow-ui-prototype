import { Tool } from './tool';

export type PresenterType = 'CONTENT' | 'SIDEBAR';

/**
 * Gemeinsamer Zustand aller Presenter.
 */
export abstract class APresenter {
  loading = false;
  visible = false;

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
