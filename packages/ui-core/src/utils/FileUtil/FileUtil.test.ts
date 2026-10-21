import {
  describe,
  expect,
  it,
} from 'vitest';

import { FileUtil } from './FileUtil';

describe('FileUtil', () => {
  describe('getReadableFileSize', () => {
    it.each([
      [-1, '-1 B'],
      [0, '0 B'],
      [1023, '1023 B'],
      [1024, '1.00 KB'],
      [1024 * 1024 - 1, '1024.00 KB'],
      [1024 * 1024, '1.00 MB'],
      [1024 ** 3 - 1, '1024.00 MB'],
      [1024 ** 3, '1.00 GB'],
    ])('formats %i bytes as %s', (sizeInBytes, expected) => {
      expect(FileUtil.getReadableFileSize(sizeInBytes)).toBe(expected);
    });
  });
});
