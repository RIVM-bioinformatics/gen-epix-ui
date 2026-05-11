import type { ReactElement } from 'react';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import { withDialog } from '@gen-epix/ui';

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
