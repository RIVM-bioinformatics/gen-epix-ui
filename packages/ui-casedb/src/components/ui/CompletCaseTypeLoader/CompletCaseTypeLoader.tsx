import { Box } from '@mui/material';
import type { PropsWithChildren } from 'react';
import {
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { CaseDbCompleteCaseType } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  AxiosUtil,
  ResponseHandler,
  useItemQuery,
} from '@gen-epix/ui';

import { DataService } from '../../../classes/services/DataService';
import { CASEDB_QUERY_KEY } from '../../../data/query';


export type CompletCaseTypeLoaderProps = PropsWithChildren<{
  readonly caseTypeId: string;
  readonly onCompleteCaseTypeLoaded?: (completeCaseType: CaseDbCompleteCaseType) => void;
}>;

export const CompletCaseTypeLoader = ({ caseTypeId, children, onCompleteCaseTypeLoaded }: CompletCaseTypeLoaderProps) => {
  const { t } = useTranslation();
  const [isSideEffectLoading, setIsSideEffectLoading] = useState(true);
  const [sideEffectError, setSideEffectError] = useState<Error>();

  const { data: completeCaseType, error: completeCaseTypeError, isLoading: isCompleteCaseTypeLoading } = useItemQuery({
    baseQueryKey: CASEDB_QUERY_KEY.COMPLETE_CASE_TYPES,
    itemId: caseTypeId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        return (await CaseDbCaseApi.getInstance().completeCaseTypesGetOne(caseTypeId, { signal })).data;
      },
    },
  });

  useEffect(() => {
    if (completeCaseType && onCompleteCaseTypeLoaded) {
      onCompleteCaseTypeLoaded(completeCaseType);
    }
  }, [completeCaseType, onCompleteCaseTypeLoaded]);

  useEffect(() => {
    const abortController = new AbortController();
    if (completeCaseType) {
      const perform = async () => {
        try {
          await Promise.all([
            DataService.getInstance().loadConcepts(abortController.signal),
            DataService.getInstance().loadMissingRegions(completeCaseType, abortController.signal),
            DataService.getInstance().loadTreeAlgorithms(completeCaseType, abortController.signal),
            DataService.getInstance().loadOrganizations(abortController.signal),
          ]);
          setIsSideEffectLoading(false);
        } catch (error) {
          if (!AxiosUtil.isAxiosCanceledError(error)) {
            setSideEffectError(error as Error);
          }
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      perform();
    }
    return () => {
      abortController.abort();
    };
  }, [completeCaseType]);

  return (
    <Box
      sx={{
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      <ResponseHandler
        error={completeCaseTypeError || sideEffectError}
        isLoading={isCompleteCaseTypeLoading || isSideEffectLoading}
        loadingMessage={t`Loading case type`}
      >
        {children}
      </ResponseHandler>
    </Box>
  );
};
