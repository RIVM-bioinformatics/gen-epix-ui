import {
  describe,
  expect,
  it,
} from 'vitest';

import { TableEventBus } from './TableEventBus';

describe('TableEventBus', () => {
  it('creates an instance with the requested row and context types', () => {
    const eventBus = new TableEventBus<{ id: string }, { selected: boolean }>();

    expect(eventBus).toBeInstanceOf(TableEventBus);
  });
});
