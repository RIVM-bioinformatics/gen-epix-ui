import { QueryClientManager } from '../QueryClientManager';
import type { CaseSetMember } from '../../../api';
import { CaseApi } from '../../../api';
import type { EpiCaseHasCaseSet } from '../../../models/epi';
import { QUERY_KEY } from '../../../models/query';
import { QueryUtil } from '../../../utils/QueryUtil';

type QueueItem = { caseId: string; promise: Promise<boolean>; resolve: (result: boolean) => void; reject: () => void; isFetching: boolean };

export class EpiListsCaseSetMembersManager {
  private readonly queuedCases: { [caseId: string]: QueueItem } = {};
  private static __instance: EpiListsCaseSetMembersManager;

  public static get instance(): EpiListsCaseSetMembersManager {
    EpiListsCaseSetMembersManager.__instance = EpiListsCaseSetMembersManager.__instance || new EpiListsCaseSetMembersManager();
    return EpiListsCaseSetMembersManager.__instance;
  }

  public cleanStaleQueue(): void {
    Object.values(this.queuedCases).forEach((item) => {
      if (!item.isFetching) {
        item.reject();
        delete this.queuedCases[item.caseId];
      }
    });
  }

  public async loadRange(caseIds: string[]): Promise<void> {
    const cache = QueryUtil.getValidQueryData<EpiCaseHasCaseSet>([QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET]) ?? {};
    const caseIdsToFetch: string[] = [];
    caseIds.forEach((caseId) => {
      if (cache[caseId] !== undefined) {
        return;
      }
      if (this.queuedCases[caseId]?.isFetching) {
        return;
      }
      if (!this.queuedCases[caseId]) {
        this.queuedCases[caseId] = this.createQueueItem(caseId);
      }

      caseIdsToFetch.push(caseId);
    });
    if (caseIdsToFetch.length === 0) {
      return;
    }

    try {
      const queryClient = QueryClientManager.instance.queryClient;
      const newCache = { ...cache };
      const caseSetMembersResult = (await CaseApi.getInstance().caseSetMembersPostQuery({
        invert: false,
        key: 'case_id',
        type: 'UUID_SET',
        members: caseIdsToFetch,
      })).data;

      caseSetMembersResult.forEach((caseSetMember: CaseSetMember) => {
        newCache[caseSetMember.case_id] = true;
      });
      caseIdsToFetch.forEach(caseId => {
        if (newCache[caseId] === undefined) {
          newCache[caseId] = false;
        }
        this.queuedCases[caseId].resolve(newCache[caseId]);
        delete this.queuedCases[caseId];
      });
      queryClient.setQueryData<EpiCaseHasCaseSet>(QueryUtil.getGenericKey(QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET), {
        ...newCache,
      });
    } catch (_error: unknown) {
      caseIdsToFetch.forEach(caseId => {
        this.queuedCases[caseId].reject();
        delete this.queuedCases[caseId];
      });
    }
  }

  public async query(caseId: string): Promise<boolean> {
    const cacheResult = this.getItemFromCache(caseId);
    if (cacheResult !== undefined) {
      return Promise.resolve(cacheResult);
    }
    if (this.queuedCases[caseId]) {
      return this.queuedCases[caseId].promise;
    }
    this.queuedCases[caseId] = this.createQueueItem(caseId);
    return this.queuedCases[caseId].promise;
  }

  private getItemFromCache(caseId: string): boolean {
    return QueryUtil.getValidQueryData<EpiCaseHasCaseSet>([QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET])?.[caseId];
  }

  private createQueueItem(caseId: string): QueueItem {
    let resolve: (result: boolean) => void;
    let reject: () => void;
    const promise = new Promise<boolean>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return {
      caseId,
      promise,
      resolve,
      reject,
      isFetching: false,
    };
  }
}
