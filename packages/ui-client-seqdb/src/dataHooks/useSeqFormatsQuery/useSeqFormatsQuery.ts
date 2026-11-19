import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SeqDbSeqFormat } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';


export const useSeqFormatOptionsQuery = (): UseOptions<SeqDbSeqFormat> => {
  const { t } = useTranslation();

  return useMemo<UseOptions<SeqDbSeqFormat>>(() => {
    const seqFormatPresentationValues: Record<SeqDbSeqFormat, string> = {
      [SeqDbSeqFormat.HASH_ONLY]: t`Hash only`,
      [SeqDbSeqFormat.NEXTCLADE]: t`Nextclade`,
      [SeqDbSeqFormat.STR_DNA]: t`DNA sequence`,
      [SeqDbSeqFormat.STR_DNA_GZB64]: t`Compressed DNA sequence`,
      [SeqDbSeqFormat.STR_DNA_INCL_GAP]: t`DNA sequence including gaps`,
      [SeqDbSeqFormat.STR_DNA_INCL_GAP_GZB64]: t`Compressed DNA sequence including gaps`,
    };
    const options = Object.values(SeqDbSeqFormat).map(value => ({
      label: seqFormatPresentationValues[value],
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
