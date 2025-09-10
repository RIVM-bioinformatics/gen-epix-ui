import type { IconButtonProps } from '@mui/material';
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  styled,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import type { EPI_ZONE } from '../../../models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import { EpiStoreContext } from '../../../stores/epiStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { EpiDashboardUtil } from '../../../utils/EpiDashboardUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { NestedDropdown } from '../../ui/NestedMenu';
import { Spinner } from '../../ui/Spinner';
import { EpiWarning } from '../EpiWarning';

export interface WidgetHeaderIconButtonProps extends IconButtonProps {
  readonly label: string;
}

export const WidgetHeaderIconButton = ({ label, ...props }: WidgetHeaderIconButtonProps) => {
  const iconButtonElement = (
    <IconButton
      {...props}
      aria-label={label}
      color={'primary'}
      sx={{
        ...props.sx,
        '& svg': {
          fontSize: 18,
        },
      }}
    />
  );

  // Note: disabled buttons cannot have a tooltip
  if (props.disabled) {
    return iconButtonElement;
  }

  return (
    <Tooltip
      arrow
      placement={'bottom'}
      title={label}
    >
      {iconButtonElement}
    </Tooltip>
  );
};

export type WidgetProps = PropsWithChildren<{
  readonly title: string | MenuItemData;
  readonly primaryMenu?: MenuItemData[];
  readonly secondaryMenu?: MenuItemData[];
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
  const [t] = useTranslation();

  const epiStore = useContext(EpiStoreContext);
  const expandZone = useStore(epiStore, (state) => state.expandZone);
  const expandedZone = useStore(epiStore, (state) => state.expandedZone);
  const enabledLayoutZoneCount = useStore(userProfileStore, (state) => EpiDashboardUtil.getEnabledZones(state.epiDashboardLayoutUserConfig).length);

  const isExpanded = expandedZone === zone;

  const onExpandButtonClick = useCallback(() => {
    expandZone(expandedZone === zone ? null : zone);
  }, [expandZone, expandedZone, zone]);

  const renderMenu = useCallback((menu: MenuItemData[]) => {
    return (
      <>
        {menu?.map(menuItemsData => {
          if (menuItemsData.items) {
            return (
              <NestedDropdown
                key={menuItemsData.label}
                ButtonProps={{
                  variant: 'text',
                  size: 'small',
                  color: 'primary',
                  disabled: menuItemsData.disabled,
                }}
                MenuProps={{ elevation: 3 }}
                menuItemsData={menuItemsData}
              />
            );
          }
          return (
            <WidgetHeaderIconButton
              key={menuItemsData.label}
              disabled={menuItemsData.disabled}
              size={'small'}
              label={menuItemsData.label}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => menuItemsData.callback(null, null)}
            >
              {menuItemsData.leftIcon || menuItemsData.rightIcon}
            </WidgetHeaderIconButton>
          );
        })}
      </>
    );
  }, []);

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
        {typeof title === 'string' && (
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
        )}
        {typeof title !== 'string' && (
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
        )}
      </Box>
    </Box>
  ), [theme, title]);

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
          {/* secondary menu */}
          <Box
            sx={{
              justifySelf: 'right',
              display: 'flex',
              height: `calc(${theme.spacing(3)} - 1px)`,
              marginTop: '1px',
            }}
          >
            {primaryMenu?.length > 0 && renderMenu(primaryMenu)}
            {primaryMenu?.length > 0 && (
              <StyledDivider
                flexItem
                orientation={'vertical'}
                variant={'middle'}
              />
            )}
          </Box>
          {/* primary menu */}
          <Box
            sx={{
              justifySelf: 'right',
              display: 'flex',
              height: `calc(${theme.spacing(3)} - 1px)`,
              marginTop: '1px',
            }}
          >
            {secondaryMenu?.length > 0 && renderMenu(secondaryMenu)}
            {secondaryMenu?.length > 0 && (
              <StyledDivider
                flexItem
                orientation={'vertical'}
                variant={'middle'}
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
