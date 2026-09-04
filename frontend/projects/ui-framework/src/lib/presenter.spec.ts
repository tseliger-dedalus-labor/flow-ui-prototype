import { AContentPresenter, APresenter, ASidebarPresenter } from './presenter';

class TestPresenter extends APresenter {
  constructor() {
    super('WebclientTool');
  }
}

class TestContentPresenter extends AContentPresenter {
  constructor() {
    super('WebclientTool');
  }
}

class TestSidebarPresenter extends ASidebarPresenter {
  constructor() {
    super('AppointmentTool');
  }
}

describe('Presenter', () => {
  it('provides common state and tool ownership', () => {
    const presenter = new TestPresenter();

    expect(presenter.loading).toBeFalse();
    expect(presenter.visible).toBeTrue();
    expect(presenter.tool).toBe('WebclientTool');

    presenter.loading = true;
    presenter.visible = false;

    expect(presenter.loading).toBeTrue();
    expect(presenter.visible).toBeFalse();
  });

  it('specializes presenters by display area', () => {
    expect(new TestContentPresenter()).toBeInstanceOf(APresenter);
    expect(new TestSidebarPresenter()).toBeInstanceOf(APresenter);
  });
});
