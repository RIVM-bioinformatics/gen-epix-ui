import type { TooltipProps } from '@mui/material';
import {
  Box,
  Tooltip,
  useTheme,
} from '@mui/material';
import type {
  MouseEvent,
  ReactNode,
} from 'react';
import {
  useCallback,
  useMemo,
} from 'react';

import type { CaseTypeRowValue } from '../../../models/epi';
import { ConfigManager } from '../../../classes/managers/ConfigManager';

export type EpiLegendaItemProps = {
  readonly children?: ReactNode;
  readonly color: string;
  readonly disabled?: boolean;
  readonly onItemClick?: (event: MouseEvent<HTMLDivElement>) => void;
  readonly onMouseLeave?: (color: string) => void;
  readonly onMouseOver?: (color: string) => void;
  readonly rowValue: CaseTypeRowValue;
  readonly tooltip?: boolean;
  readonly tooltipProps?: Partial<TooltipProps>;
};

export const EpiLegendaItem = ({ children, color, disabled, onItemClick, onMouseLeave: onMouseLeaveCallback, onMouseOver: onMouseOverCallback, rowValue, tooltip, tooltipProps }: EpiLegendaItemProps) => {
  const theme = useTheme();
  const onClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (onItemClick) {
      onItemClick(event);
    }
  }, [onItemClick]);

  const onMouseOver = useCallback((event: MouseEvent<HTMLElement>) => {
    if (onMouseOverCallback) {
      onMouseOverCallback(event.currentTarget.getAttribute('data-color'));
    }
  }, [onMouseOverCallback]);

  const onMouseLeave = useCallback((event: MouseEvent<HTMLElement>) => {
    if (onMouseLeaveCallback) {
      onMouseLeaveCallback(event.currentTarget.getAttribute('data-color'));
    }
  }, [onMouseLeaveCallback]);

  const canClick = onClick && !disabled;

  const innerContent = useMemo(() => {
    const value = rowValue.isMissing ? ConfigManager.instance.config.epi.DATA_MISSING_CHARACTER : rowValue.short;
    return (
      <Box
        sx={{
          alignItems: 'center',
          cursor: canClick ? 'pointer' : 'initial',
          display: 'flex',
          opacity: disabled ? 0.3 : 1,
        }}
      >
        <Box
          sx={{
            background: color,
            height: theme.spacing(2),
            marginRight: theme.spacing(1),
            minHeight: theme.spacing(2),
            minWidth: theme.spacing(2),
            width: theme.spacing(2),
          }}
        />
        <Box
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {children || value}
        </Box>
      </Box>
    );
  }, [canClick, children, color, disabled, rowValue.isMissing, rowValue.short, theme]);

  return (
    <Box
      data-color={color}
      onClick={canClick ? onClick : undefined}
      onMouseLeave={onMouseLeave}
      onMouseOver={onMouseOver}
    >
      {tooltip && (
        <Tooltip
          {...tooltipProps}
          title={rowValue.full}
        >
          {innerContent}
        </Tooltip>
      )}
      {!tooltip && innerContent}

    </Box>
  );
};
