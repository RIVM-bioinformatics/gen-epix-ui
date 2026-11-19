export class OmopDbAdminUtil {
  public static getPrimaryKey<TItem extends object, TKey extends keyof TItem>(item: TItem, idField: TKey, resourceName: string): string {
    const id = item[idField];
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error(`${resourceName} is missing a valid ${String(idField)}.`);
    }

    return id;
  }

  public static withId<TItem extends object, TKey extends keyof TItem>(item: TItem, idField: TKey, resourceName: string): { id: string } & TItem {
    return {
      ...item,
      id: OmopDbAdminUtil.getPrimaryKey(item, idField, resourceName),
    };
  }
}
