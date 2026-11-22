import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { SeqDbProtocolType } from '@gen-epix/api-seqdb';

import {
  protocolTypePresentationValues,
  useProtocolTypeOptionsQuery,
} from './useProtocolTypeOptionsQuery';

describe('useProtocolTypeOptionsQuery', () => {
  it('returns options in SDK declaration order with presentation labels', () => {
    const { result } = renderHook(() => useProtocolTypeOptionsQuery());

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'PCR_MEASUREMENT', value: SeqDbProtocolType.PCR_MEASUREMENT },
        { label: 'AST_MEASUREMENT', value: SeqDbProtocolType.AST_MEASUREMENT },
        { label: 'SEQUENCING', value: SeqDbProtocolType.SEQUENCING },
        { label: 'ASSEMBLY', value: SeqDbProtocolType.ASSEMBLY },
        { label: 'TAXONOMY', value: SeqDbProtocolType.TAXONOMY },
        { label: 'SEQ_CLASSIFICATION', value: SeqDbProtocolType.SEQ_CLASSIFICATION },
        { label: 'SEQ_PROFILE', value: SeqDbProtocolType.SEQ_PROFILE },
        { label: 'SEQ_DISTANCE', value: SeqDbProtocolType.SEQ_DISTANCE },
        { label: 'AST_PREDICTION', value: SeqDbProtocolType.AST_PREDICTION },
      ],
    });
  });

  it('has a presentation label for every SDK protocol type', () => {
    expect(Object.values(protocolTypePresentationValues).sort()).toEqual(Object.keys(SeqDbProtocolType).sort());
  });
});
