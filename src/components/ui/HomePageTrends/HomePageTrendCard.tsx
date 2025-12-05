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

import { TestIdUtil } from '../../../utils/TestIdUtil';

export type HomagePageTrendCardProps = {
  readonly header: string;
  readonly value: number;
  readonly diffPercentage: number;
  readonly sinceLabel: string;
  readonly callback?: () => void;
  readonly callbackLabel?: string;
};

export const HomePageTrendCard = ({ header, value, diffPercentage, sinceLabel, callback, callbackLabel }: HomagePageTrendCardProps) => {
  const theme = useTheme();

  const onCallbackButtonClick = useCallback(() => {
    callback();
  }, [callback]);

  return (
    <Card
      {...TestIdUtil.createAttributes('HomePageTrendCard', { header })}
      elevation={1}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <CardContent
        sx={{
          paddingBottom: 0,
        }}
      >
        <Typography
          component={'h3'}
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
          {...TestIdUtil.createAttributes('HomePageTrendCard-value')}
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
            {...TestIdUtil.createAttributes('HomePageTrendCard-button')}
            size={'small'}
            variant={'outlined'}
            onClick={onCallbackButtonClick}
          >
            {callbackLabel}
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
                {...TestIdUtil.createAttributes('HomePageTrendCard-diffPercentage-label')}
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
                {...TestIdUtil.createAttributes('HomePageTrendCard-diffPercentage')}
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
              <Box
                {...TestIdUtil.createAttributes('HomePageTrendCard-diffPercentage-label')}
                component={'span'}
              >
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
