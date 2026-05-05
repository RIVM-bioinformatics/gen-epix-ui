import { CaseDbFileCompression } from '@gen-epix/api-casedb';

export class FileUtil {
  public static getFileCompressionFromFileName(fileName: string): CaseDbFileCompression {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.endsWith('.gz') || lowerFileName.endsWith('.gzip')) {
      return CaseDbFileCompression.GZIP;
    }
    return CaseDbFileCompression.NONE;
  }

  public static getReadableFileSize(sizeInBytes: number): string {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
