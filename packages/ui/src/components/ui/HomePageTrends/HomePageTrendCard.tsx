import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  darken,
  Typography,
  useTheme,
} from '@mui/material';
import { t } from 'i18next';
import { useCallback } from 'react';

import { TestIdUtil } from '../../../utils/TestIdUtil';

export type HomagePageTrendCardProps = {
  readonly callback?: () => void;
  readonly callbackLabel?: string;
  readonly diffPercentage: number;
  readonly header: string;
  readonly sinceLabel: string;
  readonly value: number;
};

export const HomePageTrendCard = ({ callback, callbackLabel, diffPercentage, header, sinceLabel, value }: HomagePageTrendCardProps) => {
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
            display: 'block',
            fontSize: '1rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {header}
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
            onClick={onCallbackButtonClick}
            size={'small'}
            variant={'outlined'}
          >
            {callbackLabel}
          </Button>
        </CardActions>
      )}
      <Box
        sx={{
          background: theme.palette.grey['100'],
          justifyContent: 'flex-end',
          padding: 1,
        }}
      >
        <Box
          sx={{
            marginX: 1,
          }}
        >
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
