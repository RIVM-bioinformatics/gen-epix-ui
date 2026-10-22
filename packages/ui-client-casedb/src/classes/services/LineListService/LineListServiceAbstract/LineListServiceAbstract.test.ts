import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { QueryClientService as QueryClientServiceImplementation } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { CASEDB_QUERY_KEY } from '../../../../constants/query.constants';

import { LineListServiceAbstract } from './LineListServiceAbstract';

type Fetcher = (caseIds: string[], caseTypeId?: string) => Promise<string[]>;
type QueueState = { queuedCases: Record<string, unknown> };

class TestLineListService extends LineListServiceAbstract {
  protected readonly queryKey = CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET;

  private readonly fetcher: Fetcher;

  public constructor(queryClientService: QueryClientService, fetcher: Fetcher) {
    super(queryClientService);
    this.fetcher = fetcher;
  }

  protected async fetchMatchingCaseIds(caseIds: string[], caseTypeId?: string): Promise<string[]> {
    return this.fetcher(caseIds, caseTypeId);
  }
}

const createQueryClientService = (): QueryClientService => new QueryClientServiceImplementation({
  config: {
    queryClient: {
      retry: () => false,
      retryDelay: () => 0,
    },
  },
  queryKeyDependencies: [],
});

const setCache = (queryClientService: QueryClientService, cache: Record<string, boolean>): void => {
  queryClientService.queryClient.setQueryData(
    queryClientService.getGenericKey(CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET),
    cache,
  );
};

const removeQueuedCase = (service: TestLineListService, caseId: string): void => {
  delete (service as unknown as QueueState).queuedCases[caseId];
};

describe('LineListServiceAbstract', () => {
  it('returns cached true and false values without fetching', async () => {
    const queryClientService = createQueryClientService();
    const fetcher = vi.fn<Fetcher>();
    const service = new TestLineListService(queryClientService, fetcher);
    setCache(queryClientService, { 'cached-false': false, 'cached-true': true });

    expect(await service.query('cached-true')).toBe(true);
    expect(await service.query('cached-false')).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('deduplicates IDs and caches matching and non-matching results', async () => {
    const queryClientService = createQueryClientService();
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(['case-new']);
    const service = new TestLineListService(queryClientService, fetcher);
    setCache(queryClientService, { cached: false });

    await service.loadRange(['cached', 'case-new', 'case-missing', 'case-new']);
    await service.loadRange([]);

    expect(fetcher).toHaveBeenCalledExactlyOnceWith(['case-new', 'case-missing'], undefined);
    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET))).toEqual({
      cached: false,
      'case-missing': false,
      'case-new': true,
    });
  });

  it('keeps an in-flight query queued while cleaning only stale entries', async () => {
    let resolveFetch!: (caseIds: string[]) => void;
    const fetchPromise = new Promise<string[]>(resolve => {
      resolveFetch = resolve;
    });
    const queryClientService = createQueryClientService();
    const fetcher = vi.fn<Fetcher>().mockReturnValue(fetchPromise);
    const service = new TestLineListService(queryClientService, fetcher);
    const firstQuery = service.query('case-in-flight');
    const secondQuery = service.query('case-in-flight');
    const loadPromise = service.loadRange(['case-in-flight'], 'case-type');

    await service.loadRange(['case-in-flight']);
    service.cleanStaleQueue();
    resolveFetch(['case-in-flight']);
    await loadPromise;

    expect(await firstQuery).toBe(true);
    expect(await secondQuery).toBe(true);
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(['case-in-flight'], 'case-type');
  });

  it('rejects and removes a query that becomes stale before loading', async () => {
    const queryClientService = createQueryClientService();
    const fetcher = vi.fn<Fetcher>();
    const service = new TestLineListService(queryClientService, fetcher);
    const staleQuery = service.query('stale-case');
    const rejection = staleQuery.then((): string => 'resolved', (): undefined => undefined);

    service.cleanStaleQueue();

    await expect(rejection).resolves.toBeUndefined();
  });

  it('rejects queued queries when fetching fails', async () => {
    const queryClientService = createQueryClientService();
    const error = new Error('network failure');
    const fetcher = vi.fn<Fetcher>().mockRejectedValue(error);
    const service = new TestLineListService(queryClientService, fetcher);
    const failedQuery = service.query('failed-case');
    const rejection = failedQuery.then((): undefined => undefined, (reason: unknown): unknown => reason);

    await service.loadRange(['failed-case']);

    await expect(rejection).resolves.toBe(error);
  });

  it('continues when a queued case disappears during fetching', async () => {
    const queryClientService = createQueryClientService();
    const fetcher = vi.fn<Fetcher>();
    const service = new TestLineListService(queryClientService, fetcher);
    fetcher.mockImplementation(async ([caseId]) => {
      removeQueuedCase(service, caseId);
      return Promise.resolve<string[]>([]);
    });

    await service.loadRange(['disappearing-case']);

    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET))).toEqual({
      'disappearing-case': false,
    });
  });

  it('merges results from overlapping loads into the latest cache', async () => {
    let resolveFirst!: (caseIds: string[]) => void;
    let resolveSecond!: (caseIds: string[]) => void;
    const firstFetch = new Promise<string[]>(resolve => {
      resolveFirst = resolve;
    });
    const secondFetch = new Promise<string[]>(resolve => {
      resolveSecond = resolve;
    });
    const queryClientService = createQueryClientService();
    const fetcher = vi.fn<Fetcher>()
      .mockReturnValueOnce(firstFetch)
      .mockReturnValueOnce(secondFetch);
    const service = new TestLineListService(queryClientService, fetcher);
    const firstLoad = service.loadRange(['first-case']);
    const secondLoad = service.loadRange(['second-case']);

    resolveSecond(['second-case']);
    await secondLoad;
    resolveFirst(['first-case']);
    await firstLoad;

    expect(queryClientService.queryClient.getQueryData(queryClientService.getGenericKey(CASEDB_QUERY_KEY.XXX_CASE_ID_HAS_CASE_SET))).toEqual({
      'first-case': true,
      'second-case': true,
    });
  });
});
