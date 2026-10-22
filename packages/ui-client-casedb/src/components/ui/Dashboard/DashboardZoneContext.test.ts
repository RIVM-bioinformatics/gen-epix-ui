import { createElement } from 'react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { DashboardZoneContext } from './DashboardZoneContext';

describe('DashboardZoneContext', () => {
  it('defaults to null and accepts a configured dashboard zone', () => {
    const contextInternals = DashboardZoneContext as unknown as Record<string, null | string>;
    const provider = createElement(DashboardZoneContext.Provider, { value: 'zone-a' }, 'content');

    expect(contextInternals['_currentValue']).toBeNull();
    expect(provider.props.value).toBe('zone-a');
    expect(provider.props.children).toBe('content');
  });
});
