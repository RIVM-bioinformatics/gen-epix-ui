import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui-core-components/hoc/withDialog';
import { withDialog } from '@gen-epix/ui-core-components/hoc/withDialog';

import { useConfig } from '../../../hooks/useConfig';

export interface ConsentDialogOpenProps {
  //
}

export interface ConsentDialogProps extends WithDialogRenderProps<ConsentDialogOpenProps> {
  readonly onConsent: () => void;
}

export type ConsentDialogRefMethods = WithDialogRefMethods<ConsentDialogProps, ConsentDialogOpenProps>;

export const ConsentDialog = withDialog<ConsentDialogProps, ConsentDialogOpenProps>((
  {
    onActionsChange,
    onConsent,
    onTitleChange,
  }: ConsentDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const config = useConfig();

  useEffect(() => {
    onTitleChange(config.consentDialog.getTitle());
  }, [config, onTitleChange, t]);

  useEffect(() => {
    onActionsChange([
      {
        ...TestIdUtil.createAttributes('ConsentDialog-agree'),
        autoFocus: true,
        color: 'secondary',
        label: config.consentDialog.getButtonLabel(),
        onClick: onConsent,
        variant: 'contained',
      },
    ]);
  }, [config, onActionsChange, onConsent, t]);

  return config.consentDialog.Content();
}, {
  defaultTitle: '',
  disableBackdropClick: true,
  fullWidth: true,
  maxWidth: 'md',
  noCloseButton: true,
  testId: 'ConsentDialog',
});
