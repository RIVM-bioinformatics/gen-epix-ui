import { Box } from '@mui/material';
import type { PropsWithChildren } from 'react';
import {
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import type { CompleteCaseType } from '../../../api';
import { CaseApi } from '../../../api';
import { useItemQuery } from '../../../hooks/useItemQuery';
import { QUERY_KEY } from '../../../models/query';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { EpiDataUtil } from '../../../utils/EpiDataUtil';
import { ResponseHandler } from '../../ui/ResponseHandler';


export type EpiCompletCaseTypeLoaderProps = PropsWithChildren<{
  readonly caseTypeId: string;
  readonly onCompleteCaseTypeLoaded?: (completeCaseType: CompleteCaseType) => void;
}>;

export const EpiCompletCaseTypeLoader = ({ caseTypeId, onCompleteCaseTypeLoaded, children }: EpiCompletCaseTypeLoaderProps) => {
  const [t] = useTranslation();
  const [isSideEffectLoading, setIsSideEffectLoading] = useState(true);
  const [sideEffectError, setSideEffectError] = useState<Error>();

  const { isLoading: isCompleteCaseTypeLoading, error: completeCaseTypeError, data: completeCaseType } = useItemQuery({
    baseQueryKey: QUERY_KEY.COMPLETE_CASE_TYPES,
    itemId: caseTypeId,
    useQueryOptions: {
      queryFn: async ({ signal }) => {
        return (await CaseApi.getInstance().completeCaseTypesGetOne(caseTypeId, { signal })).data;
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
            EpiDataUtil.loadConcepts(abortController.signal),
            EpiDataUtil.loadMissingRegions(completeCaseType, abortController.signal),
            EpiDataUtil.loadTreeAlgorithms(completeCaseType, abortController.signal),
            EpiDataUtil.loadOrganizations(abortController.signal),
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
        width: '100%',
        position: 'relative',
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
