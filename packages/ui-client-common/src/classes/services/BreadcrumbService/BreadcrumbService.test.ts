import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { BreadcrumbService } from './BreadcrumbService';

const HOME_POSITION = 'Home';
const CASES_POSITION = 'Cases';

describe('BreadcrumbService', () => {
  it('starts with an empty breadcrumb map', () => {
    expect(new BreadcrumbService().data).toEqual({});
  });

  it('adds breadcrumbs without mutating the previous data', () => {
    const service = new BreadcrumbService();
    const subscriber = vi.fn();
    const previousData = service.data;
    service.subscribe(subscriber);

    service.update(HOME_POSITION, 'Home page');

    expect(service.data).toEqual({ [HOME_POSITION]: 'Home page' });
    expect(service.data).not.toBe(previousData);
    expect(previousData).toEqual({});
    expect(subscriber).toHaveBeenCalledWith({ [HOME_POSITION]: 'Home page' }, previousData);
  });

  it('overwrites an existing breadcrumb and preserves other titles', () => {
    const service = new BreadcrumbService();
    service.update(HOME_POSITION, 'Old title');
    service.update(CASES_POSITION, 'Cases page');

    service.update(HOME_POSITION, 'New title');

    expect(service.data).toEqual({
      [CASES_POSITION]: 'Cases page',
      [HOME_POSITION]: 'New title',
    });
  });

  it('removes only the requested breadcrumb and preserves the rest', () => {
    const service = new BreadcrumbService();
    service.update(HOME_POSITION, 'Home page');
    service.update(CASES_POSITION, 'Cases page');

    service.remove(HOME_POSITION);

    expect(service.data).toEqual({ [CASES_POSITION]: 'Cases page' });
  });

  it('keeps the breadcrumb map unchanged when removing an absent position', () => {
    const service = new BreadcrumbService();
    service.update(HOME_POSITION, 'Home page');
    const previousData = service.data;

    service.remove('Missing');

    expect(service.data).toEqual({ [HOME_POSITION]: 'Home page' });
    expect(service.data).not.toBe(previousData);
  });
});
