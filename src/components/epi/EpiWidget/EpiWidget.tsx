import {
  Box,
  Divider,
  Tooltip,
  Typography,
  styled,
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
  useContext,
  useCallback,
  useMemo,
  isValidElement,
} from 'react';

import type { EPI_ZONE } from '../../../models/epi';
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
  readonly title: string | MenuItemData | ReactNode;
  readonly primaryMenu?: MenuItemData[] | ReactNode;
  readonly secondaryMenu?: MenuItemData[] | ReactNode;
  readonly warningMessage?: string;
  readonly zone: EPI_ZONE;
  readonly expandDisabled?: boolean;
  readonly isLoading?: boolean;
}>;

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
}));

export const EpiWidget = ({ title, children, primaryMenu, secondaryMenu, warningMessage, zone, expandDisabled, isLoading }: WidgetProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const epiStore = useContext(EpiDashboardStoreContext);
  const expandZone = useStore(epiStore, (state) => state.expandZone);
  const expandedZone = useStore(epiStore, (state) => state.expandedZone);
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
            fontWeight={'bold'}
            sx={{
              display: 'inline-block',
              maxWidth: '100%',
              lineHeight: theme.spacing(3),
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
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
          showTopLevelTooltip
          ButtonProps={{
            variant: 'text',
            size: 'small',
            color: 'inherit',
            sx: {
              margin: 0,
              padding: 0,
              background: 'none !important',
              '& span': {
                margin: 0,
              },
              textTransform: 'none',
            },
          }}
          menuItemsData={title}
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
          position: 'absolute',
          height: theme.spacing(3),
          maxWidth: '100%',
          left: 0,
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
          height: theme.spacing(3),
          display: 'flex',
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
              justifySelf: 'right',
              display: 'flex',
              height: `calc(${theme.spacing(3)} - 1px)`,
              marginTop: '1px',
            }}
          >
            {primaryMenu && <EpiWidgetMenu menu={primaryMenu} />}
            {primaryMenu && (
              <StyledDivider
                flexItem
                orientation={'vertical'}
                variant={'middle'}
                aria-hidden={'true'}
              />
            )}
          </Box>
          {/* secondary menu */}
          <Box
            sx={{
              justifySelf: 'right',
              display: 'flex',
              height: `calc(${theme.spacing(3)} - 1px)`,
              marginTop: '1px',
            }}
          >
            {secondaryMenu && <EpiWidgetMenu menu={secondaryMenu} />}
            {secondaryMenu && (
              <StyledDivider
                flexItem
                orientation={'vertical'}
                variant={'middle'}
                aria-hidden={'true'}
              />
            )}
            {enabledLayoutZoneCount > 1 && (
              <WidgetHeaderIconButton
                disabled={expandDisabled}
                label={isExpanded ? t`Collapse` : t`Expand`}
                sx={{
                  marginRight: theme.spacing(-1),
                }}
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
