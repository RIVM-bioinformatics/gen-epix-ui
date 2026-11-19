import { useMemo } from 'react';
import type { SeqDbTaxonRank } from '@gen-epix/api-seqdb';
import { SeqDbTaxonRank as SeqDbTaxonRankValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

export const taxonRankPresentationValues: Record<SeqDbTaxonRank, string> = {
  [SeqDbTaxonRankValues.ACELLULAR_ROOT]: 'ACELLULAR_ROOT',
  [SeqDbTaxonRankValues.BIOTYPE]: 'BIOTYPE',
  [SeqDbTaxonRankValues.CLADE]: 'CLADE',
  [SeqDbTaxonRankValues.CLASS]: 'CLASS',
  [SeqDbTaxonRankValues.DOMAIN]: 'DOMAIN',
  [SeqDbTaxonRankValues.FAMILY]: 'FAMILY',
  [SeqDbTaxonRankValues.FORMA_SPECIALIS]: 'FORMA_SPECIALIS',
  [SeqDbTaxonRankValues.GENOTYPE]: 'GENOTYPE',
  [SeqDbTaxonRankValues.GENUS]: 'GENUS',
  [SeqDbTaxonRankValues.INFRACLASS]: 'INFRACLASS',
  [SeqDbTaxonRankValues.ISOLATE]: 'ISOLATE',
  [SeqDbTaxonRankValues.KINGDOM]: 'KINGDOM',
  [SeqDbTaxonRankValues.NO_RANK]: 'NO_RANK',
  [SeqDbTaxonRankValues.ORDER]: 'ORDER',
  [SeqDbTaxonRankValues.PHYLUM]: 'PHYLUM',
  [SeqDbTaxonRankValues.REALM]: 'REALM',
  [SeqDbTaxonRankValues.SEROGROUP]: 'SEROGROUP',
  [SeqDbTaxonRankValues.SEROTYPE]: 'SEROTYPE',
  [SeqDbTaxonRankValues.SPECIES]: 'SPECIES',
  [SeqDbTaxonRankValues.SPECIES_GROUP]: 'SPECIES_GROUP',
  [SeqDbTaxonRankValues.SPECIES_SUBGROUP]: 'SPECIES_SUBGROUP',
  [SeqDbTaxonRankValues.STRAIN]: 'STRAIN',
  [SeqDbTaxonRankValues.SUBCLASS]: 'SUBCLASS',
  [SeqDbTaxonRankValues.SUBFAMILY]: 'SUBFAMILY',
  [SeqDbTaxonRankValues.SUBGENUS]: 'SUBGENUS',
  [SeqDbTaxonRankValues.SUBKINGDOM]: 'SUBKINGDOM',
  [SeqDbTaxonRankValues.SUBORDER]: 'SUBORDER',
  [SeqDbTaxonRankValues.SUBPHYLUM]: 'SUBPHYLUM',
  [SeqDbTaxonRankValues.SUBSPECIES]: 'SUBSPECIES',
  [SeqDbTaxonRankValues.SUPERCLASS]: 'SUPERCLASS',
  [SeqDbTaxonRankValues.SUPERKINGDOM]: 'SUPERKINGDOM',
  [SeqDbTaxonRankValues.TRIBE]: 'TRIBE',
  [SeqDbTaxonRankValues.VARIETAS]: 'VARIETAS',
};

export const useTaxonRankOptionsQuery = (): UseOptions<SeqDbTaxonRank> => {
  return useMemo<UseOptions<SeqDbTaxonRank>>(() => {
    const options: OptionBase<SeqDbTaxonRank>[] = Object.values(SeqDbTaxonRankValues).map(value => ({
      label: taxonRankPresentationValues[value],
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
