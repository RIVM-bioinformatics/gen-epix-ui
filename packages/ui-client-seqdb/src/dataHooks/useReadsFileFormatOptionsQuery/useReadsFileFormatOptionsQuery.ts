import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SeqDbReadsFileFormat } from '@gen-epix/api-seqdb';
import { SeqDbReadsFileFormat as SeqDbReadsFileFormatValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';

export const useReadsFileFormatOptionsQuery = (): UseOptions<SeqDbReadsFileFormat> => {
  const { t } = useTranslation();

  return useMemo<UseOptions<SeqDbReadsFileFormat>>(() => {
    const readsFileFormatPresentationValues: Record<SeqDbReadsFileFormat, string> = {
      [SeqDbReadsFileFormatValues.FASTQ]: t`FASTQ`,
    };
    const options = Object.values(SeqDbReadsFileFormatValues).map(value => ({
      label: readsFileFormatPresentationValues[value],
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
