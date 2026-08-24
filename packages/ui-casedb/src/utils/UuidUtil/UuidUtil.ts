import { v4 } from 'uuid';

export class UuidUtil {
  public static createUuid(): string {
    return v4();
  }
}
