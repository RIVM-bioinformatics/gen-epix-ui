import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SeqDbLocusType } from '@gen-epix/api-seqdb';
import type { UseOptions } from '@gen-epix/ui-client-common/models/data-hooks.models';

export const useLocusTypeOptionsQuery = (): UseOptions<SeqDbLocusType> => {
  const { t } = useTranslation();

  return useMemo<UseOptions<SeqDbLocusType>>(() => {
    const locusTypePresentationValues: Record<SeqDbLocusType, string> = {
      [SeqDbLocusType.GENE]: t`Gene`,
      [SeqDbLocusType.INTERGENIC_REGION]: t`Intergenic region`,
      [SeqDbLocusType.OTHER]: t`Other`,
      [SeqDbLocusType.PCR]: t`PCR`,
      [SeqDbLocusType.TANDEM_REPEAT]: t`Tandem repeat`,
      [SeqDbLocusType.UNKNOWN]: t`Unknown`,
    };
    const options = Object.values(SeqDbLocusType).map(value => ({
      label: locusTypePresentationValues[value],
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
