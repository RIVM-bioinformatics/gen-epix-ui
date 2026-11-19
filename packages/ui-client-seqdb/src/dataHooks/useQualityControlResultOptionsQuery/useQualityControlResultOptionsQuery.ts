import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SeqDbQualityControlResult } from '@gen-epix/api-seqdb';
import { SeqDbQualityControlResult as SeqDbQualityControlResultValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';

export const useQualityControlResultOptionsQuery = (): UseOptions<SeqDbQualityControlResult> => {
  const { t } = useTranslation();

  return useMemo<UseOptions<SeqDbQualityControlResult>>(() => {
    const qualityControlResultPresentationValues: Record<SeqDbQualityControlResult, string> = {
      [SeqDbQualityControlResultValues.FAIL]: t`Fail`,
      [SeqDbQualityControlResultValues.PASS]: t`Pass`,
      [SeqDbQualityControlResultValues.PENDING]: t`Pending`,
      [SeqDbQualityControlResultValues.WARN]: t`Warning`,
    };
    const options = Object.values(SeqDbQualityControlResultValues).map(value => ({
      label: qualityControlResultPresentationValues[value],
      value,
    }));

    return {
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options,
    };
  }, [t]);
};
