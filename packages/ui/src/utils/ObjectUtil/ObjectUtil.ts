import isEqual from 'lodash/isEqual';

export class ObjectUtil {
  public static getObjectDiff(obj1: Record<string, unknown>, obj2: Record<string, unknown>) {
    const diff = Object.keys(obj2).reduce((result, key) => {
      if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
        result.push(key);
      } else if (isEqual(obj1[key], obj2[key])) {
        result.splice(result.indexOf(key), 1);
      }
      return result;
    }, Object.keys(obj1));
    return diff;
  }

  public static mergeWithUndefined<T extends { [key: string]: unknown }>(obj1: T, obj2: T): T {
    const final = {
      ...obj1,
      ...obj2,
    };
    Object.keys(obj2).forEach((key) => {
      if (obj2[key] === undefined || obj2[key] === null) {
        delete final[key];
      }
    });
    return final;
  }
}
