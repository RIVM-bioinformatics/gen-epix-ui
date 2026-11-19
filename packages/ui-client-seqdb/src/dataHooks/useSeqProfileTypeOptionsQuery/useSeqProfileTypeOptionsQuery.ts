import { useMemo } from 'react';
import type { SeqDbSeqProfileType } from '@gen-epix/api-seqdb';
import { SeqDbSeqProfileType as SeqDbSeqProfileTypeValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

export const seqProfileTypePresentationValues: Record<SeqDbSeqProfileType, string> = {
  [SeqDbSeqProfileTypeValues.ALLELE]: 'ALLELE',
  [SeqDbSeqProfileTypeValues.KMER]: 'KMER',
  [SeqDbSeqProfileTypeValues.LOCUS]: 'LOCUS',
  [SeqDbSeqProfileTypeValues.MLVA]: 'MLVA',
  [SeqDbSeqProfileTypeValues.SNP]: 'SNP',
};

export const useSeqProfileTypeOptionsQuery = (): UseOptions<SeqDbSeqProfileType> => {
  return useMemo<UseOptions<SeqDbSeqProfileType>>(() => {
    const options: OptionBase<SeqDbSeqProfileType>[] = Object.values(SeqDbSeqProfileTypeValues).map(value => ({
      label: seqProfileTypePresentationValues[value],
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
