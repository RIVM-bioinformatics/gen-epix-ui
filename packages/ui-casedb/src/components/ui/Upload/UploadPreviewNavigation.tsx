import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { use } from 'react';
import { useTableStoreContext } from '@gen-epix/ui';
import type { CaseDbCaseUploadResult } from '@gen-epix/api-casedb';

import { UploadStoreContext } from '../../../stores/uploadStore';

import { UploadNavigation } from './UploadNavigation';

export type UploadPreviewNavigationProps = {
  readonly onGoBackButtonClick: () => void;
  readonly onProceedButtonClick: () => void;
};

export const UploadPreviewNavigation = ({ onGoBackButtonClick, onProceedButtonClick }: UploadPreviewNavigationProps) => {
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<CaseDbCaseUploadResult>();
  const uploadStore = use(UploadStoreContext);

  const completeCaseType = useStore(uploadStore, (state) => state.completeCaseType);
  const selectedIds = useStore(tableStore, (state) => state.selectedIds);

  const proceedDisabled = !selectedIds.length || selectedIds.length > completeCaseType.props.create_max_n_cases;

  return (
    <UploadNavigation
      onGoBackButtonClick={onGoBackButtonClick}
      onProceedButtonClick={onProceedButtonClick}
      proceedDisabled={proceedDisabled}
      proceedLabel={selectedIds.length ? t('Proceed with {{count}} selected cases', { count: selectedIds.length }) : t('Proceed')}
    />
  );
};
