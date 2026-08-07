import "@testing-library/jest-dom";

window.HTMLElement.prototype.scrollIntoView = vi.fn();

class ResizeObserverMock {
  observe() {}

  disconnect() {}

  unobserve() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
