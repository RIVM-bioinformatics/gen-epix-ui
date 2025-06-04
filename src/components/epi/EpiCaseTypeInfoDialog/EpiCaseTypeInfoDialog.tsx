import type { ReactElement } from 'react';

import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
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
    onTitleChange,
  }: EpiCaseTypeInfoDialogProps,
): ReactElement => {
  return (<EpiCaseTypeInfoDialogContent onTitleChange={onTitleChange} />);
}, {
  testId: 'EpiCaseTypeInfoDialog',
  titleVariant: 'h2',
  fullWidth: true,
  maxWidth: 'xl',
});
