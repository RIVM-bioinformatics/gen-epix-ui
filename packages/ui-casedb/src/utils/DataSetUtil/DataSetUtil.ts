import intersection from 'lodash/intersection';

export class DataSetUtil {
  public static getCategorizedSetMembers(kwArgs: { childMemberIds: string[]; mappedSetMembers: Map<string, string[]>; parentMemberIds: string[]; parentSetId: string }): { categorizedMemberIds: string[]; setIds: string[]; uncategorizedMemberIds: string[] } {
    const { childMemberIds, mappedSetMembers, parentMemberIds, parentSetId } = kwArgs;
    const intersectedMemberIds = intersection(parentMemberIds, childMemberIds);
    let uncategorizedMemberIds: string[] = [];
    const categorizedMemberIds: string[] = [];

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
      const sortedSetsIdsBySize = Array.from(mappedSetMembers.entries()).filter(([setId]) => setIds.includes(setId)).sort((a, b) => b[1].length - a[1].length).map(x => x[0]);
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
      categorizedMemberIds,
      setIds: sanitizedSetIds,
      uncategorizedMemberIds,
    };

  }

  public static getMappedSetMembers<T>(kwArgs: { items: T[]; memberProperty: keyof T & string; setProperty: keyof T & string }): Map<string, string[]> {
    const { items, memberProperty, setProperty } = kwArgs;
    const mappedSets = new Map<string, string[]>();
    items.forEach(member => {
      if (!mappedSets.has(member[setProperty] as string)) {
        mappedSets.set(member[setProperty] as string, []);
      }
      mappedSets.get(member[setProperty] as string)?.push(member[memberProperty] as string);
    });
    return mappedSets;
  }
}
