import { FileCompression } from '../../api';

export class FileUtil {
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

  public static getFileCompressionFromFileName(fileName: string): FileCompression {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.endsWith('.gz') || lowerFileName.endsWith('.gzip')) {
      return FileCompression.GZIP;
    }
    return FileCompression.NONE;
  }
}
