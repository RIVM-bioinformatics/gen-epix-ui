import type { CaseDbCaseBatchUploadResult } from '@gen-epix/api-casedb';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { UploadError } from './UploadError';

describe('UploadError', () => {
  it('preserves the upload result and behaves like an Error', () => {
    const caseBatchUploadResult = {} as CaseDbCaseBatchUploadResult;
    const error = new UploadError('Upload failed', caseBatchUploadResult);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UploadError);
    expect(error.message).toBe('Upload failed');
    expect(error.name).toBe('UploadError');
    expect(error.caseBatchUploadResult).toBe(caseBatchUploadResult);
  });
});
