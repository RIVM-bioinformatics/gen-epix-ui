import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  act,
  renderHook,
} from '@testing-library/react';
import { container } from 'tsyringe';

import { BreadcrumbService } from '../../classes/services/BreadcrumbService';

import { useUpdateBreadcrumb } from './useUpdateBreadcrumb';

const HOME_POSITION = 'Home';
const CASES_POSITION = 'Cases';

describe('useUpdateBreadcrumb', () => {
  afterEach(() => {
    container.clearInstances();
  });

  it('updates and removes its breadcrumb over the hook lifecycle', () => {
    const breadcrumbService = new BreadcrumbService();
    container.registerInstance(BreadcrumbService, breadcrumbService);
    const { result, unmount } = renderHook(() => useUpdateBreadcrumb(HOME_POSITION));

    act(() => {
      result.current('Home page');
    });

    expect(breadcrumbService.data).toEqual({ [HOME_POSITION]: 'Home page' });

    unmount();

    expect(breadcrumbService.data).toEqual({});
  });

  it('keeps its callback stable until the position changes', () => {
    const breadcrumbService = new BreadcrumbService();
    container.registerInstance(BreadcrumbService, breadcrumbService);
    const { rerender, result, unmount } = renderHook(
      ({ position }: { position: string }) => useUpdateBreadcrumb(position),
      { initialProps: { position: HOME_POSITION } },
    );
    const firstUpdate = result.current;

    rerender({ position: HOME_POSITION });
    expect(result.current).toBe(firstUpdate);

    act(() => {
      result.current('Home page');
    });

    rerender({ position: CASES_POSITION });
    expect(breadcrumbService.data).toEqual({});

    act(() => {
      result.current('Cases page');
    });
    expect(breadcrumbService.data).toEqual({ [CASES_POSITION]: 'Cases page' });

    unmount();
    expect(breadcrumbService.data).toEqual({});
  });
});
