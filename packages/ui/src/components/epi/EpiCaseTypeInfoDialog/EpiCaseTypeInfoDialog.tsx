import type { ReactElement } from 'react';

import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';

import { EpiCaseTypeInfoDialogContent } from './EpiCaseTypeInfoDialogContent';


export interface EpiCaseTypeInfoDialogOpenProps {
  //
}

export interface EpiCaseTypeInfoDialogProps extends WithDialogRenderProps<EpiCaseTypeInfoDialogOpenProps> {
  //
}

export type EpiCaseTypeInfoDialogRefMethods = WithDialogRefMethods<EpiCaseTypeInfoDialogProps, EpiCaseTypeInfoDialogOpenProps>;

export const EpiCaseTypeInfoDialog = withDialog<EpiCaseTypeInfoDialogProps, EpiCaseTypeInfoDialogOpenProps>((
  {
    onPermalinkChange,
    onTitleChange,
  }: EpiCaseTypeInfoDialogProps,
): ReactElement => {
  return (
    <EpiCaseTypeInfoDialogContent
      onPermalinkChange={onPermalinkChange}
      onTitleChange={onTitleChange}
    />
  );
}, {
  fullWidth: true,
  maxWidth: 'xl',
  testId: 'EpiCaseTypeInfoDialog',
  titleVariant: 'h2',
});
