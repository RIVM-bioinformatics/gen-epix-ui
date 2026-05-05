import {
  Box,
  Divider,
  styled,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
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

import type { EPI_ZONE } from '../../../../../ui-casedb/src/models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { NestedDropdown } from '../../ui/NestedMenu';
import { Spinner } from '../../ui/Spinner';
import { EpiWarning } from '../EpiWarning';
import { MenuDataUtil } from '../../../utils/MenuDataUtil';
import { EpiWidgetMenu } from '../EpiWidgetMenu';
import { WidgetHeaderIconButton } from '../EpiWidgetHeaderIconButton';


export type WidgetProps = PropsWithChildren<{
  readonly expandDisabled?: boolean;
  readonly isLoading?: boolean;
  readonly primaryMenu?: MenuItemData[] | ReactNode;
  readonly secondaryMenu?: MenuItemData[] | ReactNode;
  readonly title: MenuItemData | ReactNode | string;
  readonly warningMessage?: string;
  readonly zone: EPI_ZONE;
}>;

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginBottom: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
}));

export const EpiWidget = ({ children, expandDisabled, isLoading, primaryMenu, secondaryMenu, title, warningMessage, zone }: WidgetProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const epiDashboardStore = use(EpiDashboardStoreContext);
  const expandZone = useStore(epiDashboardStore, (state) => state.expandZone);
  const expandedZone = useStore(epiDashboardStore, (state) => state.expandedZone);
  const enabledLayoutZoneCount = useStore(userProfileStore, (state) => DashboardUtil.getEnabledZones(state.epiDashboardLayoutUserConfig).length);

  const isExpanded = expandedZone === zone;

  const onExpandButtonClick = useCallback(() => {
    expandZone(expandedZone === zone ? null : zone);
  }, [expandZone, expandedZone, zone]);


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
      {...TestIdUtil.createAttributes('EpiWidget', { zone })}
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
            {primaryMenu && <EpiWidgetMenu menu={primaryMenu} />}
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
            {secondaryMenu && <EpiWidgetMenu menu={secondaryMenu} />}
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
                sx={{
                  marginRight: theme.spacing(-1),
                }}
              >
                {isExpanded && (
                  <ZoomInMapIcon />
                )}
                {!isExpanded && (
                  <ZoomOutMapIcon />
                )}
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
            <EpiWarning warningMessage={warningMessage} />
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
