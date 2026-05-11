import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { use } from 'react';
import { useTableStoreContext } from '@gen-epix/ui';

import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import type { CaseUploadResultWithGeneratedId } from '../../../models/epi';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadValidateNavigationProps = {
  readonly onGoBackButtonClick: () => void;
  readonly onProceedButtonClick: () => void;
};

export const EpiUploadValidateNavigation = ({ onGoBackButtonClick, onProceedButtonClick }: EpiUploadValidateNavigationProps) => {
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<CaseUploadResultWithGeneratedId>();
  const uploadStore = use(EpiUploadStoreContext);

  const completeCaseType = useStore(uploadStore, (state) => state.completeCaseType);
  const selectedIds = useStore(tableStore, (state) => state.selectedIds);

  const proceedDisabled = !selectedIds.length || selectedIds.length > completeCaseType.props.create_max_n_cases;

  return (
    <EpiUploadNavigation
      onGoBackButtonClick={onGoBackButtonClick}
      onProceedButtonClick={onProceedButtonClick}
      proceedDisabled={proceedDisabled}
      proceedLabel={t`Continue`}
    />
  );
};
