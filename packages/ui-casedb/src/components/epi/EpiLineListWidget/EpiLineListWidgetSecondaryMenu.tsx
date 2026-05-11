import {
  use,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import LinkIcon from '@mui/icons-material/Link';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { useTheme } from '@mui/material';
import type { MenuItemData } from '@gen-epix/ui';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { EpiWidgetMenu } from '../EpiWidgetMenu';

export type EpiLineListWidgetSecondaryMenuProps = {
  readonly onLink: () => void;
};

export const EpiLineListWidgetSecondaryMenu = ({
  onLink,
}: EpiLineListWidgetSecondaryMenuProps) => {
  const theme = useTheme();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const { t } = useTranslation();
  const isTreeLinked = useStore(epiDashboardStore, useShallow((state) => state.epiTreeWidgetData.zoomLevel === 1));
  const setSorting = useStore(epiDashboardStore, useShallow((state) => state.setSorting));

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
        callback: onLinkButtonClick,
        disabled: isTreeLinked,
        label: t`Link and snap the Tree to the Line list (resets tree zoom level and Line List sorting)`,
        leftIcon: (
          <LinkIcon
            sx={{
              color: isTreeLinked ? undefined : theme.palette.error.main,
            }}
          />
        ),
      },
    ];
  }, [isTreeLinked, onLinkButtonClick, t, theme.palette.error.main]);

  return <EpiWidgetMenu menu={menu} />;
};
