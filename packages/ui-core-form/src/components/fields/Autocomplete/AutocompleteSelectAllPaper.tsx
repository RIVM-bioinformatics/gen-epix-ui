import type { MouseEvent } from 'react';
import {
  use,
  useCallback,
} from 'react';
import {
  Box,
  Checkbox,
  Divider,
  Paper,
} from '@mui/material';
import type { PaperProps } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';

import { AutocompleteSelectAllContext } from './AutocompleteSelectAllContext';

export const AutocompleteSelectAllPaper = ({ children, ...props }: PaperProps) => {
  const ctx = use(AutocompleteSelectAllContext);

  const onClickSelectAll = useCallback(() => {
    if (!ctx) {
      return;
    }
    const { currentValues, enabledOptionValues, handleSelectAll } = ctx;
    const selCount = currentValues.filter(v => enabledOptionValues.includes(v)).length;
    const curIsAll = enabledOptionValues.length > 0 && selCount === enabledOptionValues.length;
    handleSelectAll(curIsAll, currentValues);
  }, [ctx]);

  const onMouseDownSelectAll = useCallback((e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  const currentValues = ctx?.currentValues ?? [];
  const enabledOptionValues = ctx?.enabledOptionValues ?? [];
  const selectedEnabledCount = currentValues.filter(v => enabledOptionValues.includes(v)).length;
  const isAll = enabledOptionValues.length > 0 && selectedEnabledCount === enabledOptionValues.length;
  const isSome = selectedEnabledCount > 0 && !isAll;

  return (
    <Paper {...props}>
      {!!ctx && (
        <>
          <Box
            onClick={onClickSelectAll}
            onMouseDown={onMouseDownSelectAll}
            sx={{ '&:hover': { bgcolor: 'action.hover' }, alignItems: 'center', cursor: 'pointer', display: 'flex' }}
          >
            <Checkbox
              checked={isAll}
              checkedIcon={<CheckBoxIcon />}
              icon={<CheckBoxOutlineBlankIcon />}
              indeterminate={isSome}
              indeterminateIcon={<IndeterminateCheckBoxIcon />}
              style={{ marginRight: 8 }}
            />
            {ctx.selectAllLabel}
          </Box>
          <Divider />
        </>
      )}
      {children}
    </Paper>
  );
};
