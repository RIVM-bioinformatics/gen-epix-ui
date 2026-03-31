import { isValid } from 'date-fns/isValid';
import {
  number,
  string,
} from 'yup';

export class SchemaUtil {
  public static get number() {
    return number().nullable();
  }

  public static get code() {
    return string().extendedAlphaNumeric().required().max(100);
  }

  public static get label() {
    return string().extendedAlphaNumeric().required().max(100);
  }

  public static get name() {
    return string().extendedAlphaNumeric().required().max(100);
  }

  public static get description() {
    return string().freeFormText().max(1000);
  }

  public static get rank() {
    return SchemaUtil.number.required().min(0).integer();
  }

  public static get isoString() {
    return string().transform((_val: unknown, orig: Date) => isValid(orig) ? orig.toISOString() : undefined);
  }
}
