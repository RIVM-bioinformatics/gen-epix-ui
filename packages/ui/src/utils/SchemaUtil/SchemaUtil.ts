import { isValid } from 'date-fns/isValid';
import {
  number,
  string,
} from 'yup';

import { NumberUtil } from '../NumberUtil';

export class SchemaUtil {
  public static get number() {
    return number().transform((_val: unknown, orig: string | number) => {
      if (orig === '' || orig === null || orig === undefined) {
        return undefined;
      }
      if (typeof orig === 'number') {
        return orig;
      }
      if (typeof orig === 'string') {
        const parsed = NumberUtil.parse(orig);
        return isNaN(parsed) ? undefined : parsed;
      }
    });
  }

  public static get code() {
    return string().freeFormText().required().max(100);
  }

  public static get name() {
    return string().required().freeFormText().max(100);
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
