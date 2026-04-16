import type { CaseDbCaseBatchUploadResult } from '@gen-epix/api-casedb';

export class UploadError extends Error {
  public caseBatchUploadResult: CaseDbCaseBatchUploadResult;

  public constructor(message: string, caseBatchUploadResult: CaseDbCaseBatchUploadResult) {
    super(message);
    this.name = 'UploadError';
    this.caseBatchUploadResult = caseBatchUploadResult;
  }
}
