import { useMemo } from 'react';
import type { SeqDbSeqDistanceType } from '@gen-epix/api-seqdb';
import { SeqDbSeqDistanceType as SeqDbSeqDistanceTypeValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

export const seqDistanceTypePresentationValues: Record<SeqDbSeqDistanceType, string> = {
  [SeqDbSeqDistanceTypeValues.ALLELE_HAMMING]: 'ALLELE_HAMMING',
  [SeqDbSeqDistanceTypeValues.KMER_EUCLIDEAN]: 'KMER_EUCLIDEAN',
  [SeqDbSeqDistanceTypeValues.MLVA_EUCLIDEAN]: 'MLVA_EUCLIDEAN',
  [SeqDbSeqDistanceTypeValues.MLVA_HAMMING]: 'MLVA_HAMMING',
  [SeqDbSeqDistanceTypeValues.SNP_HAMMING]: 'SNP_HAMMING',
};

export const useSeqDistanceTypeOptionsQuery = (): UseOptions<SeqDbSeqDistanceType> => {
  return useMemo<UseOptions<SeqDbSeqDistanceType>>(() => {
    const options: OptionBase<SeqDbSeqDistanceType>[] = Object.values(SeqDbSeqDistanceTypeValues).map(value => ({
      label: seqDistanceTypePresentationValues[value],
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
  }, []);
};
