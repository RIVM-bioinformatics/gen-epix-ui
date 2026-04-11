import {
  Box,
  styled,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SeparatorProps } from 'react-resizable-panels';
import { Separator } from 'react-resizable-panels';

const StyledSeparator = styled(Separator)(() => ({}));

export const PanelSeparatorHorizontal = (props: SeparatorProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <StyledSeparator
      {...props}
      aria-label={t('Horizontal separator')}
      sx={{
        '&:hover > div': {
          background: theme.palette.primary.main,
          height: '3px',
          margin: '4px 0',
        },
        height: '11px',
      }}
    >
      <Box
        sx={{
          background: theme.palette.divider,
          height: '1px',
          margin: '5px 0',
          width: '100%',
        }}
      />
    </StyledSeparator>
  );
};
