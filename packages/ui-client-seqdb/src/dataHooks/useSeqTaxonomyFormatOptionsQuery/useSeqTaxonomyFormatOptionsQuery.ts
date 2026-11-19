import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SeqDbSeqTaxonomyFormat } from '@gen-epix/api-seqdb';
import { SeqDbSeqTaxonomyFormat as SeqDbSeqTaxonomyFormatValues } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';

export const useSeqTaxonomyFormatOptionsQuery = (): UseOptions<SeqDbSeqTaxonomyFormat> => {
  const { t } = useTranslation();

  return useMemo<UseOptions<SeqDbSeqTaxonomyFormat>>(() => {
    const seqTaxonomyFormatPresentationValues: Record<SeqDbSeqTaxonomyFormat, string> = {
      [SeqDbSeqTaxonomyFormatValues.TAXONOMY_FORMAT1]: t`Taxonomy format 1`,
    };
    const options = Object.values(SeqDbSeqTaxonomyFormatValues).map(value => ({
      label: seqTaxonomyFormatPresentationValues[value],
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
