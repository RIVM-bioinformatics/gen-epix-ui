import type { ReactElement } from 'react';

import { EpiDashboardStoreLoader } from '../EpiDashboardStoreLoader';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
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
    onTitleChange,
    onPermalinkChange,
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
  testId: 'EpiCaseTypeInfoDialogWithLoader',
  titleVariant: 'h2',
  fullWidth: true,
  maxWidth: 'xl',
});
