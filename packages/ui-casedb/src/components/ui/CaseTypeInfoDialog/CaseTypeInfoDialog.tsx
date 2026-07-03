import type { ReactElement } from 'react';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import { withDialog } from '@gen-epix/ui';

import { CaseTypeInfoDialogContent } from './CaseTypeInfoDialogContent';


export interface CaseTypeInfoDialogOpenProps {
  //
}

export interface CaseTypeInfoDialogProps extends WithDialogRenderProps<CaseTypeInfoDialogOpenProps> {
  //
}

export type CaseTypeInfoDialogRefMethods = WithDialogRefMethods<CaseTypeInfoDialogProps, CaseTypeInfoDialogOpenProps>;

export const CaseTypeInfoDialog = withDialog<CaseTypeInfoDialogProps, CaseTypeInfoDialogOpenProps>((
  {
    onPermalinkChange,
    onTitleChange,
  }: CaseTypeInfoDialogProps,
): ReactElement => {
  return (
    <CaseTypeInfoDialogContent
      onPermalinkChange={onPermalinkChange}
      onTitleChange={onTitleChange}
    />
  );
}, {
  fullWidth: true,
  maxWidth: 'xl',
  testId: 'CaseTypeInfoDialog',
  titleVariant: 'h2',
});
