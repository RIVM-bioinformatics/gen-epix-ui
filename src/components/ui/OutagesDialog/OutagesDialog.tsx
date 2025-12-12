import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useStore } from 'zustand';

import { OutageList } from '../OutageList/OutageList';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
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
    onTitleChange,
    onActionsChange,
    onClose,
  }: OutagesDialogProps,
): ReactElement => {
  const [t] = useTranslation();
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
          color: 'secondary',
          autoFocus: true,
          onClick: onClose,
          variant: 'contained',
          label: t`Close`,
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
  testId: 'OutagesDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
