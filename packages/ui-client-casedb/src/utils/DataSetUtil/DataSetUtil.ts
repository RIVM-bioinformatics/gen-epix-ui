import intersection from 'lodash/intersection';

export class DataSetUtil {
  public static getCategorizedSetMembers(kwArgs: { childMemberIds: string[]; mappedSetMembers: Map<string, string[]>; parentMemberIds: string[]; parentSetId: string }): { categorizedMemberIds: string[]; setIds: string[]; uncategorizedMemberIds: string[] } {
    const { childMemberIds, mappedSetMembers, parentMemberIds, parentSetId } = kwArgs;
    const intersectedMemberIds = intersection(parentMemberIds, childMemberIds);
    let uncategorizedMemberIds: string[] = [];
    const categorizedMemberIds: string[] = [];

    const selectedSets: { id: string; memberIds: string[] }[] = [];
    if (intersectedMemberIds.length) {
      if (intersectedMemberIds.length === parentMemberIds.length && intersectedMemberIds.length === childMemberIds.length) {
        // all members are in the parent set and child set, so we can use the parent set id (optimization)
        selectedSets.push({ id: parentSetId, memberIds: intersectedMemberIds });
        categorizedMemberIds.push(...intersectedMemberIds);
      } else {
        mappedSetMembers.forEach((memberIds, setId) => {
          if (!memberIds.length) {
            return;
          }
          const setIntersectedMemberIds = intersection(memberIds, intersectedMemberIds);
          if (setIntersectedMemberIds.length === memberIds.length) {
            selectedSets.push({ id: setId, memberIds: setIntersectedMemberIds });
            categorizedMemberIds.push(...setIntersectedMemberIds);
          }
        });
        uncategorizedMemberIds = intersectedMemberIds.filter(id => !categorizedMemberIds.includes(id));
      }
    }

    // sanitize setIds (remove duplicates, larger sets containing smaller sets)
    const sanitizedSetIds: string[] = [];
    if (selectedSets.length <= 1) {
      sanitizedSetIds.push(...selectedSets.map(({ id }) => id));
    } else {
      const sortedSetsBySize = [...selectedSets].sort((a, b) => b.memberIds.length - a.memberIds.length);
      selectedSets.forEach(({ id, memberIds }) => {
        const setIdIndex = sortedSetsBySize.findIndex(set => set.id === id);
        for (let i = 0; i < setIdIndex; i++) {
          const otherSetMemberIds = sortedSetsBySize[i].memberIds;
          if (intersection(otherSetMemberIds, memberIds).length === memberIds.length) {
            // other set contains current set, do not add current set
            return;
          }
        }
        sanitizedSetIds.push(id);
      });
    }

    return {
      categorizedMemberIds: [...new Set(categorizedMemberIds)],
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
