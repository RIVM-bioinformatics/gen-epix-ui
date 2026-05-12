import type { ReactElement } from 'react';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import { withDialog } from '@gen-epix/ui';

import { EpiDashboardStoreLoader } from '../EpiDashboardStoreLoader';

import { EpiCaseTypeInfoDialogContent } from './EpiCaseTypeInfoDialogContent';

export interface EpiCaseTypeInfoDialogWithLoaderOpenProps {
  caseTypeId: string;
}

export interface EpiCaseTypeInfoDialogWithLoaderProps extends WithDialogRenderProps<EpiCaseTypeInfoDialogWithLoaderOpenProps> {
  //
}

export type EpiCaseTypeInfoDialogWithLoaderRefMethods = WithDialogRefMethods<EpiCaseTypeInfoDialogWithLoaderProps, EpiCaseTypeInfoDialogWithLoaderOpenProps>;

export const EpiCaseTypeInfoDialogWithLoader = withDialog<EpiCaseTypeInfoDialogWithLoaderProps, EpiCaseTypeInfoDialogWithLoaderOpenProps>((
  {
    onPermalinkChange,
    onTitleChange,
    openProps,
  }: EpiCaseTypeInfoDialogWithLoaderProps,
): ReactElement => {
  console.log('EpiCaseTypeInfoDialogWithLoader render', { openProps });
  return (
    <EpiDashboardStoreLoader caseTypeId={openProps.caseTypeId}>
      <EpiCaseTypeInfoDialogContent
        onPermalinkChange={onPermalinkChange}
        onTitleChange={onTitleChange}
      />
    </EpiDashboardStoreLoader>
  );
}, {
  fullWidth: true,
  maxWidth: 'xl',
  testId: 'EpiCaseTypeInfoDialogWithLoader',
  titleVariant: 'h2',
});
