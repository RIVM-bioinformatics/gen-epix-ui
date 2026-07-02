import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import { ConfigService } from '../../../classes/services/ConfigService';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';

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
