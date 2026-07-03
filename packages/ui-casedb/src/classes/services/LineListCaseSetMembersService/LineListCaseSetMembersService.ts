import type { CaseDbCaseSetMember } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  HmrUtil,
  QueryClientService,
} from '@gen-epix/ui';

import type { CaseHasCaseSet } from '../../../models/caseDb';
import { CASEDB_QUERY_KEY } from '../../../data/query';


type QueueItem = { caseId: string; isFetching: boolean; promise: Promise<boolean>; reject: () => void; resolve: (result: boolean) => void };

export class LineListCaseSetMembersService {
  private static __instance: LineListCaseSetMembersService;

  private readonly queuedCases: { [caseId: string]: QueueItem } = {};

  private constructor() {
    //
  }

  public static getInstance(): LineListCaseSetMembersService {
    LineListCaseSetMembersService.__instance = HmrUtil.getHmrSingleton('lineListCaseSetMembersService', LineListCaseSetMembersService.__instance, () => new LineListCaseSetMembersService());
    return LineListCaseSetMembersService.__instance;
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
    const cache = QueryClientService.getInstance().getValidQueryData<CaseHasCaseSet>([CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET]) ?? {};
    const caseIdsToFetch: string[] = [];
    caseIds.forEach((caseId) => {
      if (caseIdsToFetch.includes(caseId)) {
        return;
      }
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
      const queryClient = QueryClientService.getInstance().queryClient;
      const newCache = { ...cache };
      const caseSetMembersResult = (await CaseDbCaseApi.getInstance().caseSetMembersPostQuery({
        invert: false,
        key: 'case_id',
        members: caseIdsToFetch,
        type: 'UUID_SET',
      }, null, null)).data;

      caseSetMembersResult.forEach((caseSetMember: CaseDbCaseSetMember) => {
        newCache[caseSetMember.case_id] = true;
      });
      caseIdsToFetch.forEach(caseId => {
        if (newCache[caseId] === undefined) {
          newCache[caseId] = false;
        }
        this.queuedCases[caseId]?.resolve(newCache[caseId]);
        delete this.queuedCases[caseId];
      });
      queryClient.setQueryData<CaseHasCaseSet>(QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET), {
        ...newCache,
      });
    } catch (_error: unknown) {
      caseIdsToFetch.forEach(caseId => {
        this.queuedCases[caseId]?.reject();
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

  private createQueueItem(caseId: string): QueueItem {
    let resolve: (result: boolean) => void;
    let reject: () => void;
    const promise = new Promise<boolean>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return {
      caseId,
      isFetching: false,
      promise,
      reject,
      resolve,
    };
  }

  private getItemFromCache(caseId: string): boolean {
    return QueryClientService.getInstance().getValidQueryData<CaseHasCaseSet>([CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET])?.[caseId];
  }
}
