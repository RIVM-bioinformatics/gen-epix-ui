import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SeqDbFileCompression } from '@gen-epix/api-seqdb';
import { SeqDbFileCompression as SeqDbFileCompressionValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';

export const useFileCompressionOptionsQuery = (): UseOptions<SeqDbFileCompression> => {
  const { t } = useTranslation();

  return useMemo<UseOptions<SeqDbFileCompression>>(() => {
    const fileCompressionPresentationValues: Record<SeqDbFileCompression, string> = {
      [SeqDbFileCompressionValues.GZIP]: t`GZIP`,
      [SeqDbFileCompressionValues.NONE]: t`None`,
    };
    const options = Object.values(SeqDbFileCompressionValues).map(value => ({
      label: fileCompressionPresentationValues[value],
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
