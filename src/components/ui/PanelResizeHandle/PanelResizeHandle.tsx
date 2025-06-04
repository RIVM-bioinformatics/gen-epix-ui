import {
  Box,
  styled,
  useTheme,
} from '@mui/material';
import type { PanelResizeHandleProps } from 'react-resizable-panels';
import { PanelResizeHandle } from 'react-resizable-panels';

const StyledPanelResizeHandle = styled(PanelResizeHandle)(() => ({}));

export const PanelResizeHandleHorizontal = (props: PanelResizeHandleProps) => {
  const theme = useTheme();
  return (
    <StyledPanelResizeHandle
      {...props}
      sx={{
        height: '11px',
        '&:hover > div': {
          background: theme.palette.primary.main,
          margin: '4px 0',
          height: '3px',
        },
      }}
    >
      <Box sx={{
        background: theme.palette.divider,
        width: '100%',
        margin: '5px 0',
        height: '1px',
      }}
      />
    </StyledPanelResizeHandle>
  );
};

export const PanelResizeHandleVertical = (props: PanelResizeHandleProps) => {
  const theme = useTheme();
  return (
    <StyledPanelResizeHandle
      {...props}
      sx={{
        width: '11px',
        '&:hover > div': {
          background: theme.palette.primary.main,
          margin: '0 4px ',
          width: '3px',
        },
      }}
    >
      <Box sx={{
        background: theme.palette.divider,
        height: '100%',
        margin: '0 5px',
        width: '1px',
      }}
      />
    </StyledPanelResizeHandle>
  );
};
