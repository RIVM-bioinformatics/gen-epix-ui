import {
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import LinkIcon from '@mui/icons-material/Link';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { useTheme } from '@mui/material';

import type { MenuItemData } from '../../../models/nestedMenu';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { EpiWidgetMenu } from '../EpiWidgetMenu';

export type EpiLineListSecondaryMenuProps = {
  readonly onLink: () => void;
};

export const EpiLineListSecondaryMenu = ({
  onLink,
}: EpiLineListSecondaryMenuProps) => {
  const theme = useTheme();
  const epiStore = useContext(EpiDashboardStoreContext);
  const { t } = useTranslation();
  const isTreeLinked = useStore(epiStore, useShallow((state) => state.epiTreeWidgetData.zoomLevel === 1));
  const setSorting = useStore(epiStore, useShallow((state) => state.setSorting));

  const onLinkButtonClick = useCallback(() => {
    const perform = async () => {
      await setSorting(null, null);
      onLink();
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [onLink, setSorting]);

  const menu = useMemo<MenuItemData[]>(() => {
    return [
      {
        disabled: isTreeLinked,
        label: t`Link and snap the Tree to the Line list (resets tree zoom level and Line List sorting)`,
        leftIcon: (
          <LinkIcon
            sx={{
              color: isTreeLinked ? undefined : theme.palette.error.main,
            }}
          />
        ),
        callback: onLinkButtonClick,
      },
    ];
  }, [isTreeLinked, onLinkButtonClick, t, theme.palette.error.main]);

  return <EpiWidgetMenu menu={menu} />;
};
