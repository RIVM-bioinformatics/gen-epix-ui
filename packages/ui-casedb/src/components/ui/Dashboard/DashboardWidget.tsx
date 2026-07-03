import {
  Box,
  Divider,
  styled,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import type {
  PropsWithChildren,
  ReactNode,
} from 'react';
import {
  isValidElement,
  use,
  useCallback,
  useMemo,
} from 'react';
import type { MenuItemData } from '@gen-epix/ui';
import {
  MenuDataUtil,
  NestedDropdown,
  Spinner,
  TestIdUtil,
} from '@gen-epix/ui';

import { WidgetMenu } from '../WidgetMenu';
import { WidgetHeaderIconButton } from '../WidgetHeaderIconButton';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { Warning } from '../Warning';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

import { DashboardZoneContext } from './DashboardZoneContext';


export type DashboardWidgetProps = PropsWithChildren<{
  readonly expandDisabled?: boolean;
  readonly isLoading?: boolean;
  readonly primaryMenu?: MenuItemData[] | ReactNode;
  readonly secondaryMenu?: MenuItemData[] | ReactNode;
  readonly title: MenuItemData | ReactNode | string;
  readonly warningMessage?: string;
  readonly widgetName?: string;
}>;

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginBottom: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
}));

export const DashboardWidget = ({ children, expandDisabled, isLoading, primaryMenu, secondaryMenu, title, warningMessage, widgetName }: DashboardWidgetProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const userProfileStore = use(UserProfileStoreContext);
  const dashboardStore = use(DashboardStoreContext);
  const zoneKey = use(DashboardZoneContext);
  const expandZone = useStore(dashboardStore, (state) => state.expandZone);
  const expandedZone = useStore(dashboardStore, (state) => state.expandedZone);
  const enabledLayoutZoneCount = useStore(userProfileStore, (state) => DashboardUtil.getEnabledWidgets(state.dashboardArrangementConfig).length);
  const setDashboardArrangementConfig = useStore(userProfileStore, (state) => state.setDashboardArrangementConfig);

  const isExpanded = expandedZone === zoneKey;

  const onExpandButtonClick = useCallback(() => {
    expandZone(expandedZone === zoneKey ? null : zoneKey);
  }, [expandZone, expandedZone, zoneKey]);

  const onRemoveButtonClick = useCallback(() => {
    const { dashboardArrangementConfig } = userProfileStore.getState();
    setDashboardArrangementConfig({
      ...dashboardArrangementConfig,
      arrangementWidgetAssignments: {
        ...dashboardArrangementConfig.arrangementWidgetAssignments,
        [zoneKey]: null,
      },
    });
  }, [setDashboardArrangementConfig, userProfileStore, zoneKey]);


  const titleInnerElement = useMemo(() => {
    if (typeof title === 'string') {
      return (
        <Tooltip
          arrow
          placement={'right'}
          title={title}
        >
          <Typography
            component={'h2'}
            sx={{
              display: 'inline-block',
              fontWeight: 'bold',
              lineHeight: theme.spacing(3),
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            variant={'body1'}
          >
            {title}
          </Typography>
        </Tooltip>
      );
    }
    if (isValidElement(title)) {
      return title;
    }
    if (MenuDataUtil.isMenuItemData(title)) {
      return (
        <NestedDropdown
          ButtonProps={{
            color: 'inherit',
            size: 'small',
            sx: {
              '& span': {
                margin: 0,
              },
              background: 'none !important',
              margin: 0,
              padding: 0,
              textTransform: 'none',
            },
            variant: 'text',
          }}
          menuItemsData={title}
          showTopLevelTooltip
        />
      );
    }
  }, [theme, title]);

  const titleElement = useMemo(() => (
    <Box
      sx={{
        height: theme.spacing(3),
        position: 'relative',
        width: '100%',
      }}
    >
      <Box
        sx={{
          height: theme.spacing(3),
          left: 0,
          maxWidth: '100%',
          position: 'absolute',
        }}
      >
        {titleInnerElement}
      </Box>
    </Box>
  ), [theme, titleInnerElement]);

  return (
    <Box
      {...TestIdUtil.createAttributes('DashboardWidget', { 'widget-name': widgetName })}
      sx={{
        height: '100%',
      }}
    >

      {/* Widget header bar */}
      <Box
        sx={{
          display: 'flex',
          height: theme.spacing(3),
          justifyContent: 'space-between',
        }}
      >
        {/* Title */}
        {titleElement}
        <Box
          sx={{
            display: 'flex',
          }}
        >
          {/* primary menu */}
          <Box
            sx={{
              display: 'flex',
              height: `calc(${theme.spacing(3)} - 1px)`,
              justifySelf: 'right',
              marginTop: '1px',
            }}
          >
            {primaryMenu && <WidgetMenu menu={primaryMenu} />}
            {primaryMenu && (
              <StyledDivider
                aria-hidden={'true'}
                flexItem
                orientation={'vertical'}
                variant={'middle'}
              />
            )}
          </Box>
          {/* secondary menu */}
          <Box
            sx={{
              display: 'flex',
              height: `calc(${theme.spacing(3)} - 1px)`,
              justifySelf: 'right',
              marginTop: '1px',
            }}
          >
            {secondaryMenu && <WidgetMenu menu={secondaryMenu} />}
            {secondaryMenu && (
              <StyledDivider
                aria-hidden={'true'}
                flexItem
                orientation={'vertical'}
                variant={'middle'}
              />
            )}
            {enabledLayoutZoneCount > 1 && (
              <WidgetHeaderIconButton
                disabled={expandDisabled}
                label={isExpanded ? t`Collapse` : t`Expand`}
                onClick={onExpandButtonClick}
              >
                {isExpanded && (
                  <ZoomInMapIcon />
                )}
                {!isExpanded && (
                  <ZoomOutMapIcon />
                )}
              </WidgetHeaderIconButton>
            )}
            {!isExpanded && (
              <WidgetHeaderIconButton
                label={t`Remove widget`}
                onClick={onRemoveButtonClick}
                sx={{
                  marginRight: theme.spacing(-1),
                }}
              >
                <CloseIcon />
              </WidgetHeaderIconButton>
            )}
          </Box>
        </Box>

      </Box>
      {/* Widget content */}
      <Box
        sx={{
          height: `calc(100% - ${theme.spacing(3)})`,
          position: 'relative',
        }}
      >
        {warningMessage && (
          <Box
            sx={{
              height: theme.spacing(3),
            }}
          >
            <Warning warningMessage={warningMessage} />
          </Box>
        )}
        <Box
          sx={{
            height: warningMessage ? `calc(100% - ${theme.spacing(3)})` : '100%',
          }}
        >
          {isLoading && (
            <Spinner
              label={t`Loading`}
            />
          )}
          {!isLoading && children}
        </Box>
      </Box>
    </Box>
  );
};
