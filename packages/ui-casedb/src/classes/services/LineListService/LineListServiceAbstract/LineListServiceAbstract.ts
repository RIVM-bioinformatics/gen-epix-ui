import { QueryClientService } from '@gen-epix/ui';

import type { CASEDB_QUERY_KEY } from '../../../../data/query';


type CaseIdCache = { [caseId: string]: boolean };

type QueueItem = { caseId: string; isFetching: boolean; promise: Promise<boolean>; reject: () => void; resolve: (result: boolean) => void };

export abstract class LineListServiceAbstract {
  protected abstract readonly queryKey: CASEDB_QUERY_KEY;

  private readonly queuedCases: { [caseId: string]: QueueItem } = {};

  public cleanStaleQueue(): void {
    Object.values(this.queuedCases).forEach((item) => {
      if (!item.isFetching) {
        item.reject();
        delete this.queuedCases[item.caseId];
      }
    });
  }

  public async loadRange(caseIds: string[], caseTypeId?: string): Promise<void> {
    const cache = QueryClientService.getInstance().getValidQueryData<CaseIdCache>([this.queryKey]) ?? {};
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

    caseIdsToFetch.forEach(caseId => {
      if (this.queuedCases[caseId]) {
        this.queuedCases[caseId].isFetching = true;
      }
    });

    try {
      const queryClient = QueryClientService.getInstance().queryClient;
      const newCache = { ...cache };
      const matchingCaseIds = await this.fetchMatchingCaseIds(caseIdsToFetch, caseTypeId);

      matchingCaseIds.forEach((caseId) => {
        newCache[caseId] = true;
      });
      caseIdsToFetch.forEach(caseId => {
        if (newCache[caseId] === undefined) {
          newCache[caseId] = false;
        }
        this.queuedCases[caseId]?.resolve(newCache[caseId]);
        delete this.queuedCases[caseId];
      });
      queryClient.setQueryData<CaseIdCache>(QueryClientService.getInstance().getGenericKey(this.queryKey), {
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

  protected abstract fetchMatchingCaseIds(caseIds: string[], caseTypeId?: string): Promise<string[]>;

  private createQueueItem(caseId: string): QueueItem {
    let resolve!: (result: boolean) => void;
    let reject!: () => void;
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

  private getItemFromCache(caseId: string): boolean | undefined {
    return QueryClientService.getInstance().getValidQueryData<CaseIdCache>([this.queryKey])?.[caseId];
  }

}
