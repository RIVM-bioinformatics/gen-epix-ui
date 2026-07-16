import {
  Box,
  CircularProgress,
  useTheme,
} from '@mui/material';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import {
  memo,
  useEffect,
  useState,
} from 'react';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';

import { LineListIsOwnCaseService } from '../../../classes/services/LineListService/LineListIsOwnCaseService';

type LineListWidgetIsOwnCaseCellProps = {
  readonly row: CaseDbCase;
};

export const LineListWidgetIsOwnCaseCell = memo(({ row }: LineListWidgetIsOwnCaseCellProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isTrue, setIsTrue] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const perform = async () => {
      try {
        setIsTrue(await LineListIsOwnCaseService.getInstance().query(row.id));
      } catch (_error) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void perform();
  }, [row.id]);

  return (
    <Box>
      {isLoading && (
        <CircularProgress
          size={16}
          sx={{
            marginTop: '4px',
            position: 'absolute',
          }}
        />
      )}
      {!isLoading && hasError && (
        <Box sx={{ color: `${theme.palette.error.main}` }}>
          {'?'}
        </Box>
      )}
      {!isLoading && !hasError && isTrue && (
        <CorporateFareIcon
          fontSize={'small'}
          style={{
            color: theme.palette.primary.main,
            height: 20,
            marginLeft: theme.spacing(-0.5),
            position: 'absolute',
            width: 20,
          }}
        />
      )}

    </Box>
  );
});
