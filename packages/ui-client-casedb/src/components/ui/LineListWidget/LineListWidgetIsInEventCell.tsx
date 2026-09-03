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

import CollectionIcon from '../../../assets/icons/CollectionIcon.svg?react';
import { LineListCaseSetMembersService } from '../../../classes/services/LineListService/LineListCaseSetMembersService';

type LineListWidgetIsInEventCellProps = {
  readonly row: CaseDbCase;
};

export const LineListWidgetIsInEventCell = memo(({ row }: LineListWidgetIsInEventCellProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isTrue, setIsTrue] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const perform = async () => {
      try {
        setIsTrue(await LineListCaseSetMembersService.getInstance().query(row.id));
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
        <CollectionIcon
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
