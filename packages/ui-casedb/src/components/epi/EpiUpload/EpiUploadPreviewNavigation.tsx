import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { use } from 'react';
import { useTableStoreContext } from '@gen-epix/ui';
import type { CaseDbCaseUploadResult } from '@gen-epix/api-casedb';

import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadPreviewNavigationProps = {
  readonly onGoBackButtonClick: () => void;
  readonly onProceedButtonClick: () => void;
};

export const EpiUploadPreviewNavigation = ({ onGoBackButtonClick, onProceedButtonClick }: EpiUploadPreviewNavigationProps) => {
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<CaseDbCaseUploadResult>();
  const uploadStore = use(EpiUploadStoreContext);

  const completeCaseType = useStore(uploadStore, (state) => state.completeCaseType);
  const selectedIds = useStore(tableStore, (state) => state.selectedIds);

  const proceedDisabled = !selectedIds.length || selectedIds.length > completeCaseType.props.create_max_n_cases;

  return (
    <EpiUploadNavigation
      onGoBackButtonClick={onGoBackButtonClick}
      onProceedButtonClick={onProceedButtonClick}
      proceedDisabled={proceedDisabled}
      proceedLabel={selectedIds.length ? t('Proceed with {{count}} selected cases', { count: selectedIds.length }) : t('Proceed')}
    />
  );
};
