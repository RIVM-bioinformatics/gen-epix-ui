import type { CaseBatchUploadResult } from '../../api';

export class UploadError extends Error {
  public caseBatchUploadResult: CaseBatchUploadResult;

  public constructor(message: string, caseBatchUploadResult: CaseBatchUploadResult) {
    super(message);
    this.name = 'UploadError';
    this.caseBatchUploadResult = caseBatchUploadResult;
  }
}
