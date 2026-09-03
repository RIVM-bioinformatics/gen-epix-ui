import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui-core-components/hoc/withDialog';
import { withDialog } from '@gen-epix/ui-core-components/hoc/withDialog';

import { ConfigService } from '../../../classes/services/ConfigService';

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

  useEffect(() => {
    onTitleChange(ConfigService.getInstance().config.consentDialog.getTitle());
  }, [onTitleChange, t]);

  useEffect(() => {
    onActionsChange([
      {
        ...TestIdUtil.createAttributes('ConsentDialog-agree'),
        autoFocus: true,
        color: 'secondary',
        label: ConfigService.getInstance().config.consentDialog.getButtonLabel(),
        onClick: onConsent,
        variant: 'contained',
      },
    ]);
  }, [onActionsChange, onConsent, t]);

  return ConfigService.getInstance().config.consentDialog.Content();
}, {
  defaultTitle: '',
  disableBackdropClick: true,
  fullWidth: true,
  maxWidth: 'md',
  noCloseButton: true,
  testId: 'ConsentDialog',
});
