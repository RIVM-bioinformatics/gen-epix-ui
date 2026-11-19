import { useMemo } from 'react';
import type { SeqDbProtocolType } from '@gen-epix/api-seqdb';
import { SeqDbProtocolType as SeqDbProtocolTypeValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

export const protocolTypePresentationValues: Record<SeqDbProtocolType, string> = {
  [SeqDbProtocolTypeValues.ASSEMBLY]: 'ASSEMBLY',
  [SeqDbProtocolTypeValues.AST_MEASUREMENT]: 'AST_MEASUREMENT',
  [SeqDbProtocolTypeValues.AST_PREDICTION]: 'AST_PREDICTION',
  [SeqDbProtocolTypeValues.PCR_MEASUREMENT]: 'PCR_MEASUREMENT',
  [SeqDbProtocolTypeValues.SEQ_CLASSIFICATION]: 'SEQ_CLASSIFICATION',
  [SeqDbProtocolTypeValues.SEQ_DISTANCE]: 'SEQ_DISTANCE',
  [SeqDbProtocolTypeValues.SEQ_PROFILE]: 'SEQ_PROFILE',
  [SeqDbProtocolTypeValues.SEQUENCING]: 'SEQUENCING',
  [SeqDbProtocolTypeValues.TAXONOMY]: 'TAXONOMY',
};

export const useProtocolTypeOptionsQuery = (): UseOptions<SeqDbProtocolType> => {
  return useMemo<UseOptions<SeqDbProtocolType>>(() => {
    const options: OptionBase<SeqDbProtocolType>[] = Object.values(SeqDbProtocolTypeValues).map(value => ({
      label: protocolTypePresentationValues[value],
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
