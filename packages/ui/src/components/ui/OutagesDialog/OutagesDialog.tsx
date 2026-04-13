import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useStore } from 'zustand';

import { OutageList } from '../OutageList/OutageList';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { outagesStore } from '../../../stores/outagesStore';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export interface OutagesDialogOpenProps {
  //
}

export interface OutagesDialogProps extends WithDialogRenderProps<OutagesDialogOpenProps> {
  //
}

export type OutagesDialogRefMethods = WithDialogRefMethods<OutagesDialogProps, OutagesDialogOpenProps>;


export const OutagesDialog = withDialog<OutagesDialogProps, OutagesDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
  }: OutagesDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const visibleOutages = useStore(outagesStore, (state) => state.visibleOutages);
  const activeOutages = useStore(outagesStore, (state) => state.activeOutages);
  const soonActiveOutages = useStore(outagesStore, (state) => state.soonActiveOutages);

  useEffect(() => {
    onTitleChange(t`Outages`);
  }, [onTitleChange, t]);

  useEffect(() => {
    onActionsChange(
      [
        {
          ...TestIdUtil.createAttributes('OutagesDialog-close'),
          autoFocus: true,
          color: 'secondary',
          label: t`Close`,
          onClick: onClose,
          variant: 'contained',
        },
      ],
    );
  }, [onActionsChange, onClose, t]);

  return (
    <OutageList
      activeOutages={activeOutages}
      soonActiveOutages={soonActiveOutages}
      visibleOutages={visibleOutages}
    />
  );
}, {
  defaultTitle: '',
  disableBackdropClick: false,
  fullWidth: true,
  maxWidth: 'md',
  noCloseButton: false,
  testId: 'OutagesDialog',
});
