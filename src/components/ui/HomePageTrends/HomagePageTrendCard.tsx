import {
  Card,
  CardContent,
  Typography,
  Box,
  darken,
  useTheme,
  Button,
  CardActions,
} from '@mui/material';
import { t } from 'i18next';
import { useCallback } from 'react';

export type HomagePageTrendCardProps = {
  readonly header: string;
  readonly value: number;
  readonly diffPercentage: number;
  readonly sinceLabel: string;
  readonly callback?: () => void;
  readonly callbackLabel?: string;
};

export const HomagePageTrendCard = ({ header, value, diffPercentage, sinceLabel, callback, callbackLabel }: HomagePageTrendCardProps) => {
  const theme = useTheme();

  const onCallbackButtonClick = useCallback(() => {
    callback();
  }, [callback]);

  return (
    <Card
      elevation={1}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <CardContent sx={{
        paddingBottom: 0,
      }}
      >
        <Typography
          component={'p'}
          sx={{
            fontSize: '1rem',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            display: 'block',
            whiteSpace: 'nowrap',
          }}
        >
          {t(header)}
        </Typography>
        <Typography
          sx={{ fontSize: '1.8rem' }}
        >
          {value.toLocaleString()}
        </Typography>
      </CardContent>
      {callback && callbackLabel && (
        <CardActions
          sx={{
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={onCallbackButtonClick}
            size="small"
            variant="outlined"
          >{callbackLabel}
          </Button>
        </CardActions>
      )}
      <Box
        padding={1}
        sx={{
          background: theme.palette.grey['100'],
          justifyContent: 'flex-end',
        }}
      >
        <Box marginX={1}>
          {diffPercentage === 0 && (
            <Typography>
              <Box
                component={'span'}
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 'bold',
                }}
              >
                {t('No change')}
              </Box>
            </Typography>
          )}
          {diffPercentage !== 0 && (
            <Typography>
              <Box
                component={'span'}
                sx={{
                  color: diffPercentage > 0 ? darken(theme.palette.success.main, 0.4) : theme.palette.error.main,
                  fontWeight: 'bold',
                }}
              >
                {diffPercentage > 0 ? '+' : ''}
                {diffPercentage.toLocaleString()}
                {'%'}

              </Box>
              <Box component={'span'}>
                {' '}
                {sinceLabel}
              </Box>
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
};
