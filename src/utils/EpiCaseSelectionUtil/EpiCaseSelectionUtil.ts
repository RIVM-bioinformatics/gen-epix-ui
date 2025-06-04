import intersection from 'lodash/intersection';

export class EpiCaseSelectionUtil {
  public static addComponentCaseIdsToSelection(componentCaseIds: string[], selectedIds: string[]): string[] {
    const caseIds = [...selectedIds, ...componentCaseIds];
    return Array.from(new Set(caseIds));
  }

  public static removeComponentCaseIdsFromSelection(componentCaseIds: string[], selectedIds: string[]): string[] {
    return selectedIds.filter(caseId => !componentCaseIds.includes(caseId));
  }

  public static refineSelectionWithComponentCaseIds(componentCaseIds: string[], selectedIds: string[]): string[] {
    return componentCaseIds.filter(caseId => selectedIds.includes(caseId));
  }

  public static canAddToSelection(componentCaseIds: string[], selectedIds: string[]): boolean {
    const intersectedCaseIds = intersection(componentCaseIds, selectedIds);
    return intersectedCaseIds.length !== componentCaseIds.length;
  }

  public static canRemoveFromSelection(componentCaseIds: string[], selectedIds: string[]): boolean {
    const intersectedCaseIds = intersection(componentCaseIds, selectedIds);
    return intersectedCaseIds.length > 0;
  }

  public static canRefineSelection(componentCaseIds: string[], selectedIds: string[]): boolean {
    const intersectedCaseIds = intersection(componentCaseIds, selectedIds);
    const negationResult = intersectedCaseIds.length === 0 || (intersectedCaseIds.length === componentCaseIds.length && intersectedCaseIds.length === selectedIds.length);
    return !negationResult;
  }
}
