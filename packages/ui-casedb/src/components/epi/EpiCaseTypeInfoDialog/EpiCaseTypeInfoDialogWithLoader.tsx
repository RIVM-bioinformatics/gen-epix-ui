import type { ReactElement } from 'react';

import { EpiDashboardStoreLoader } from '../EpiDashboardStoreLoader';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';

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
