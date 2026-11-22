import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { SeqDbTaxonRank } from '@gen-epix/api-seqdb';

import {
  taxonRankPresentationValues,
  useTaxonRankOptionsQuery,
} from './useTaxonRankOptionsQuery';

describe('useTaxonRankOptionsQuery', () => {
  it('returns options in SDK declaration order with presentation labels', () => {
    const { result } = renderHook(() => useTaxonRankOptionsQuery());

    expect(result.current).toEqual({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
      options: [
        { label: 'NO_RANK', value: SeqDbTaxonRank.NO_RANK },
        { label: 'ACELLULAR_ROOT', value: SeqDbTaxonRank.ACELLULAR_ROOT },
        { label: 'REALM', value: SeqDbTaxonRank.REALM },
        { label: 'DOMAIN', value: SeqDbTaxonRank.DOMAIN },
        { label: 'SUPERKINGDOM', value: SeqDbTaxonRank.SUPERKINGDOM },
        { label: 'KINGDOM', value: SeqDbTaxonRank.KINGDOM },
        { label: 'SUBKINGDOM', value: SeqDbTaxonRank.SUBKINGDOM },
        { label: 'PHYLUM', value: SeqDbTaxonRank.PHYLUM },
        { label: 'SUBPHYLUM', value: SeqDbTaxonRank.SUBPHYLUM },
        { label: 'SUPERCLASS', value: SeqDbTaxonRank.SUPERCLASS },
        { label: 'CLASS', value: SeqDbTaxonRank.CLASS },
        { label: 'SUBCLASS', value: SeqDbTaxonRank.SUBCLASS },
        { label: 'INFRACLASS', value: SeqDbTaxonRank.INFRACLASS },
        { label: 'ORDER', value: SeqDbTaxonRank.ORDER },
        { label: 'SUBORDER', value: SeqDbTaxonRank.SUBORDER },
        { label: 'FAMILY', value: SeqDbTaxonRank.FAMILY },
        { label: 'SUBFAMILY', value: SeqDbTaxonRank.SUBFAMILY },
        { label: 'GENUS', value: SeqDbTaxonRank.GENUS },
        { label: 'SUBGENUS', value: SeqDbTaxonRank.SUBGENUS },
        { label: 'SPECIES_GROUP', value: SeqDbTaxonRank.SPECIES_GROUP },
        { label: 'SPECIES_SUBGROUP', value: SeqDbTaxonRank.SPECIES_SUBGROUP },
        { label: 'SPECIES', value: SeqDbTaxonRank.SPECIES },
        { label: 'SEROGROUP', value: SeqDbTaxonRank.SEROGROUP },
        { label: 'SEROTYPE', value: SeqDbTaxonRank.SEROTYPE },
        { label: 'BIOTYPE', value: SeqDbTaxonRank.BIOTYPE },
        { label: 'VARIETAS', value: SeqDbTaxonRank.VARIETAS },
        { label: 'FORMA_SPECIALIS', value: SeqDbTaxonRank.FORMA_SPECIALIS },
        { label: 'SUBSPECIES', value: SeqDbTaxonRank.SUBSPECIES },
        { label: 'GENOTYPE', value: SeqDbTaxonRank.GENOTYPE },
        { label: 'STRAIN', value: SeqDbTaxonRank.STRAIN },
        { label: 'CLADE', value: SeqDbTaxonRank.CLADE },
        { label: 'TRIBE', value: SeqDbTaxonRank.TRIBE },
        { label: 'ISOLATE', value: SeqDbTaxonRank.ISOLATE },
      ],
    });
  });

  it('has a presentation label for every SDK taxon rank', () => {
    expect(Object.values(taxonRankPresentationValues).sort()).toEqual(Object.keys(SeqDbTaxonRank).sort());
  });
});
