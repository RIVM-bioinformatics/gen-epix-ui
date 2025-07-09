import intersection from 'lodash/intersection';

export class DataSetUtil {
  public static getMappedSetMembers<T>(kwArgs: { items: T[]; setProperty: keyof T & string; memberProperty: keyof T & string }): Map<string, string[]> {
    const { items, setProperty, memberProperty } = kwArgs;
    const mappedSets = new Map<string, string[]>();
    items.forEach(member => {
      if (!mappedSets.has(member[setProperty] as string)) {
        mappedSets.set(member[setProperty] as string, []);
      }
      mappedSets.get(member[setProperty] as string)?.push(member[memberProperty] as string);
    });
    return mappedSets;
  }

  public static getCategorizedSetMembers(kwArgs: { mappedSetMembers: Map<string, string[]>; parentSetId: string; parentMemberIds: string[]; childMemberIds: string[] }): { setIds: string[]; categorizedMemberIds: string[]; uncategorizedMemberIds: string[] } {
    const { mappedSetMembers, parentSetId, parentMemberIds, childMemberIds } = kwArgs;
    const sortedSetsIdsBySize = Array.from(mappedSetMembers.entries()).sort((a, b) => b[1].length - a[1].length).map(x => x[0]);
    const intersectedMemberIds = intersection(parentMemberIds, childMemberIds);
    let uncategorizedMemberIds: string[] = [];
    let categorizedMemberIds: string[] = [];

    const setIds: string[] = [];
    if (intersectedMemberIds.length) {
      if (intersectedMemberIds.length === parentMemberIds.length && intersectedMemberIds.length === childMemberIds.length) {
        // all members are in the parent set and child set, so we can use the parent set id (optimization)
        setIds.push(parentSetId);
        categorizedMemberIds.push(...intersectedMemberIds);
      } else {
        mappedSetMembers.forEach((memberIds, setId) => {
          const setIntersectedMemberIds = intersection(memberIds, intersectedMemberIds);
          if (setIntersectedMemberIds.length === memberIds.length) {
            setIds.push(setId);
            categorizedMemberIds.push(...setIntersectedMemberIds);
          }
        });
        uncategorizedMemberIds = intersectedMemberIds.filter(id => !categorizedMemberIds.includes(id));
      }
    }

    // sanitize setIds (remove duplicates, larger sets containing smaller sets)
    const sanitizedSetIds: string[] = [];
    if (setIds.length <= 1) {
      sanitizedSetIds.push(...setIds);
    } else {
      setIds.forEach(setId => {
        const setIdIndex = sortedSetsIdsBySize.indexOf(setId);
        for (let i = 0; i < setIdIndex; i++) {
          const otherSetId = sortedSetsIdsBySize[i];
          if (mappedSetMembers.get(otherSetId)?.length && mappedSetMembers.get(setId)?.length) {
            const otherSetMemberIds = mappedSetMembers.get(otherSetId) || [];
            const setMemberIds = mappedSetMembers.get(setId) || [];
            if (intersection(otherSetMemberIds, setMemberIds).length === setMemberIds.length) {
              // other set contains current set, do not add current set
              return;
            }
          }
        }
        sanitizedSetIds.push(setId);
      });
    }

    return {
      setIds: sanitizedSetIds,
      uncategorizedMemberIds,
      categorizedMemberIds,
    };

  }
}
