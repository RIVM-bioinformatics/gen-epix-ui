import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useContext } from 'react';

import type { CaseUploadResultWithGeneratedId } from '../../../models/epi';
import { useTableStoreContext } from '../../../stores/tableStore';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadValidateNavigationProps = {
  readonly onGoBackButtonClick: () => void;
  readonly onProceedButtonClick: () => void;
};

export const EpiUploadValidateNavigation = ({ onGoBackButtonClick, onProceedButtonClick }: EpiUploadValidateNavigationProps) => {
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<CaseUploadResultWithGeneratedId>();
  const uploadStore = useContext(EpiUploadStoreContext);

  const completeCaseType = useStore(uploadStore, (state) => state.completeCaseType);
  const selectedIds = useStore(tableStore, (state) => state.selectedIds);

  const proceedDisabled = !selectedIds.length || selectedIds.length > completeCaseType.create_max_n_cases;

  return (
    <EpiUploadNavigation
      proceedLabel={t`Continue`}
      proceedDisabled={proceedDisabled}
      onGoBackButtonClick={onGoBackButtonClick}
      onProceedButtonClick={onProceedButtonClick}
    />
  );
};
