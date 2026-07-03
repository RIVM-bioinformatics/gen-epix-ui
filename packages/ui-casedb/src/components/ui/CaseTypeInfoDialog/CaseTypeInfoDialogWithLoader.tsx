import type { ReactElement } from 'react';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import { withDialog } from '@gen-epix/ui';

import { DashboardStoreLoader } from '../DashboardStoreLoader';

import { CaseTypeInfoDialogContent } from './CaseTypeInfoDialogContent';

export interface CaseTypeInfoDialogWithLoaderOpenProps {
  caseTypeId: string;
}

export interface CaseTypeInfoDialogWithLoaderProps extends WithDialogRenderProps<CaseTypeInfoDialogWithLoaderOpenProps> {
  //
}

export type CaseTypeInfoDialogWithLoaderRefMethods = WithDialogRefMethods<CaseTypeInfoDialogWithLoaderProps, CaseTypeInfoDialogWithLoaderOpenProps>;

export const CaseTypeInfoDialogWithLoader = withDialog<CaseTypeInfoDialogWithLoaderProps, CaseTypeInfoDialogWithLoaderOpenProps>((
  {
    onPermalinkChange,
    onTitleChange,
    openProps,
  }: CaseTypeInfoDialogWithLoaderProps,
): ReactElement => {
  return (
    <DashboardStoreLoader caseTypeId={openProps.caseTypeId}>
      <CaseTypeInfoDialogContent
        onPermalinkChange={onPermalinkChange}
        onTitleChange={onTitleChange}
      />
    </DashboardStoreLoader>
  );
}, {
  fullWidth: true,
  maxWidth: 'xl',
  testId: 'CaseTypeInfoDialogWithLoader',
  titleVariant: 'h2',
});
