import { container } from 'tsyringe';
import { Box } from '@mui/material';
import type { PropsWithChildren } from 'react';
import {
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { CaseDbCompleteCaseType } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { AxiosUtil } from '@gen-epix/ui-client-common/utils/AxiosUtil';
import { ResponseHandler } from '@gen-epix/ui-client-common/components/ui/ResponseHandler';
import { useItemQuery } from '@gen-epix/ui-client-common/hooks/useItemQuery';

import { DataService } from '../../../classes/services/DataService';
import { CASEDB_QUERY_KEY } from '../../../constants/query.constants';


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
        return (await container.resolve(CaseDbCaseApi).completeCaseTypesGetOne(caseTypeId, { signal })).data;
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
            container.resolve(DataService).loadConcepts(abortController.signal),
            container.resolve(DataService).loadMissingRegions(completeCaseType, abortController.signal),
            container.resolve(DataService).loadTreeAlgorithms(completeCaseType, abortController.signal),
            container.resolve(DataService).loadOrganizations(abortController.signal),
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
