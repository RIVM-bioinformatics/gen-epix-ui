import isEqual from 'lodash/isEqual';

export class ObjectUtil {
  public static deepRemoveEmptyStrings<T>(inputObject: T): T {
    const clonedObject = JSON.parse(JSON.stringify(inputObject)) as T;

    if (typeof clonedObject === 'string') {
      return clonedObject === '' ? null : clonedObject;
    }
    if (Array.isArray(clonedObject)) {
      return clonedObject.map(item => ObjectUtil.deepRemoveEmptyStrings<T>(item as unknown as T)) as unknown as T;
    }
    if (typeof clonedObject === 'object' && clonedObject !== null) {
      const newObj: { [key: string]: unknown } = {};
      Object.entries(clonedObject).forEach(([key, value]) => {
        newObj[key] = ObjectUtil.deepRemoveEmptyStrings(value);
      });
      return newObj as T;
    }
    return clonedObject;
  }

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
