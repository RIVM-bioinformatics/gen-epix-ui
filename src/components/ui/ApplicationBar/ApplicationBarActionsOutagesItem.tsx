import type { BadgeOwnProps } from '@mui/material';
import {
  Badge,
  IconButton,
} from '@mui/material';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Fragment } from 'react/jsx-runtime';
import ConstructionIcon from '@mui/icons-material/Construction';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import {
  OutagesDialog,
  type OutagesDialogRefMethods,
} from '../OutagesDialog';
import { outagesStore } from '../../../stores/outagesStore';

export const ApplicationBarActionsOutagesItem = () => {
  const [t] = useTranslation();
  const outagesDialogRef = useRef<OutagesDialogRefMethods>(null);
  const visibleOutages = useStore(outagesStore, (state) => state.visibleOutages);
  const activeOutages = useStore(outagesStore, (state) => state.activeOutages);
  const soonActiveOutages = useStore(outagesStore, (state) => state.soonActiveOutages);


  const badgeColor = useMemo<BadgeOwnProps['color']>(() => {
    if (activeOutages.length > 0) {
      return 'error';
    }
    if (soonActiveOutages.length > 0) {
      return 'warning';
    }
    if (visibleOutages.length > 0) {
      return 'info';
    }
    return 'default';
  }, [activeOutages.length, soonActiveOutages.length, visibleOutages.length]);

  const badgeContent = useMemo<string>(() => {
    if (activeOutages.length > 0 || visibleOutages.length > 0 || soonActiveOutages.length > 0) {
      return '!';
    }
    return null;
  }, [activeOutages.length, soonActiveOutages.length, visibleOutages.length]);

  const onMenuIconClick = useCallback(() => {
    outagesDialogRef.current.open();
  }, []);


  return (
    <Fragment>
      <IconButton
        aria-label={t`Outages`}
        color={'inherit'}
        title={t`Outages`}
        onClick={onMenuIconClick}
      >
        <Badge
          badgeContent={badgeContent}
          color={badgeColor}
          sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 15, minWidth: 15, border: '1px solid white' } }}
        >
          <ConstructionIcon color={'inherit'} />
        </Badge>

      </IconButton>
      <OutagesDialog ref={outagesDialogRef} />
    </Fragment>
  );
};
