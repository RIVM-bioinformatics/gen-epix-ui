import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
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
    onTitleChange,
    onActionsChange,
    onConsent,
  }: ConsentDialogProps,
): ReactElement => {
  const [t] = useTranslation();

  useEffect(() => {
    onTitleChange(ConfigManager.instance.config.consentDialog.getTitle(t));
  }, [onTitleChange, t]);

  useEffect(() => {
    onActionsChange([
      {
        ...TestIdUtil.createAttributes('ConsentDialog-agree'),
        color: 'secondary',
        autoFocus: true,
        onClick: onConsent,
        variant: 'contained',
        label: ConfigManager.instance.config.consentDialog.getButtonLabel(t),
      },
    ]);
  }, [onActionsChange, onConsent, t]);

  return ConfigManager.instance.config.consentDialog.Content();
}, {
  testId: 'ConsentDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: true,
  disableBackdropClick: true,
});
