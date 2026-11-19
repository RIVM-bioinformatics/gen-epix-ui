import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SeqDbSeqFileFormat } from '@gen-epix/api-seqdb';
import { SeqDbSeqFileFormat as SeqDbSeqFileFormatValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';

export const useSeqFileFormatOptionsQuery = (): UseOptions<SeqDbSeqFileFormat> => {
  const { t } = useTranslation();

  return useMemo<UseOptions<SeqDbSeqFileFormat>>(() => {
    const seqFileFormatPresentationValues: Record<SeqDbSeqFileFormat, string> = {
      [SeqDbSeqFileFormatValues.FASTA]: t`FASTA`,
    };
    const options = Object.values(SeqDbSeqFileFormatValues).map(value => ({
      label: seqFileFormatPresentationValues[value],
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
