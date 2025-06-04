import type { TooltipProps } from '@mui/material';
import {
  Box,
  Tooltip,
  useTheme,
} from '@mui/material';
import type { MouseEvent } from 'react';
import {
  useCallback,
  useMemo,
} from 'react';

import type { CaseTypeRowValue } from '../../../models/epi';

export type EpiLegendaItemProps = {
  readonly color: string;
  readonly rowValue: CaseTypeRowValue;
  readonly onItemClick?: (event: MouseEvent<HTMLDivElement>) => void;
  readonly onMouseOver?: (color: string) => void;
  readonly onMouseLeave?: (color: string) => void;
  readonly tooltip?: boolean;
  readonly tooltipProps?: Partial<TooltipProps>;
  readonly disabled?: boolean;
};

export const EpiLegendaItem = ({ rowValue, color, onItemClick, tooltip, tooltipProps, onMouseOver: onMouseOverCallback, onMouseLeave: onMouseLeaveCallback, disabled }: EpiLegendaItemProps) => {
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
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        cursor: canClick ? 'pointer' : 'initial',
        opacity: disabled ? 0.3 : 1,
      }}
      >
        <Box
          sx={{
            width: theme.spacing(2),
            height: theme.spacing(2),
            minWidth: theme.spacing(2),
            minHeight: theme.spacing(2),
            background: color,
            marginRight: theme.spacing(1),
          }}
        />
        <Box sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        >
          {rowValue.short}
        </Box>
      </Box>
    );
  }, [canClick, color, disabled, rowValue.short, theme]);

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
