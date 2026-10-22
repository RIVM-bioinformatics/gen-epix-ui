import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { HmrUtil } from './HmrUtil';

describe('HmrUtil', () => {
  describe('getHmrSingleton', () => {
    it('reuses the current instance without creating another', () => {
      const currentInstance = { id: 'current' };
      const create = vi.fn(() => ({ id: 'created' }));

      expect(HmrUtil.getHmrSingleton('service', currentInstance, create)).toBe(currentInstance);
      expect(create).not.toHaveBeenCalled();
    });

    it('creates an instance when none is available', () => {
      const createdInstance = { id: 'created' };
      const create = vi.fn(() => createdInstance);

      expect(HmrUtil.getHmrSingleton('service', undefined, create)).toBe(createdInstance);
      expect(create).toHaveBeenCalledOnce();
    });
  });
});
