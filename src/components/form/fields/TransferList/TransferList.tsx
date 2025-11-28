import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FormControl,
  FormHelperText,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  Checkbox,
  ListItemText,
  Button,
  Grid,
  Box,
  FormLabel,
  useTheme,
  TextField,
} from '@mui/material';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  UseControllerReturn,
  FieldValues,
  Path,
} from 'react-hook-form';
import intersection from 'lodash/intersection';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';

import type { TransferListOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';

export type TransferListProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly options: TransferListOption[];
  readonly loading?: boolean;
  readonly height?: number;
};

export const TransferList = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  name,
  options,
  warningMessage,
  required,
  onChange: onChangeProp,
  loading,
  label,
  height = 500,
}: TransferListProps<TFieldValues, TName>): ReactElement => {
  const [t] = useTranslation();

  const theme = useTheme();
  const { control, formState: { errors }, resetField } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const id = useId();
  const [checked, setChecked] = useState<string[]>([]);
  const [filterValue, setFilterValue] = useState<string>();

  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = !!errorMessage;

  const onFilterValueChangeDebounced = useDebouncedCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value);
  }, 200, { trailing: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internalOnChange = useCallback((value: string[], onChange: (...event: any[]) => void) => {
    if (required && value === null) {
      return;
    }
    if (onChangeProp) {
      onChangeProp(value as TFieldValues[TName]);
    }
    onChange(value);
  }, [onChangeProp, required]);

  const mappedOptions = useMemo(() => {
    const map: { [key: string]: TransferListOption } = {};
    options.forEach((option) => {
      map[option.value] = option;
    });
    return map;
  }, [options]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });
    const valueItems = value as string[];
    const left: string[] = Object.keys(mappedOptions).filter(option => !valueItems.includes(option));
    const right: string[] = Object.keys(mappedOptions).filter(option => valueItems.includes(option));
    const leftChecked: string[] = intersection(checked, left);
    const rightChecked: string[] = intersection(checked, right);

    const handleToggle = (item: string) => () => {
      const currentIndex = checked.indexOf(item);
      const newChecked = [...checked];
      if (currentIndex === -1) {
        newChecked.push(item);
      } else {
        newChecked.splice(currentIndex, 1);
      }
      setChecked(newChecked);
    };
    const onMoveAllRightButtonClick = () => {
      setChecked([]);
      internalOnChange(Object.keys(mappedOptions), onChange);
    };
    const onMoveAllLeftButtonClick = () => {
      setChecked([]);
      internalOnChange([], onChange);
    };
    const onMoveRightButtonClick = () => {
      setChecked([]);
      internalOnChange([...valueItems, ...leftChecked], onChange);
    };
    const onMoveLeftButtonClick = () => {
      setChecked([]);
      internalOnChange(valueItems.filter(x => !rightChecked.includes(x)), onChange);
    };

    const onResetButtonClick = () => {
      setChecked([]);
      resetField(name);
    };

    const customList = (items: readonly string[]) => (
      <Paper
        square
        elevation={1}
        sx={{
          width: '100%',
          height,
          overflow: 'auto',
        }}
      >
        <List
          dense
          component={'div'}
          role={'list'}
        >
          {items.filter(item => {
            if (!filterValue) {
              return true;
            }
            return mappedOptions[item].label.toLowerCase().includes(filterValue.toLowerCase());
          }).map((item) => {
            const option = mappedOptions[item];
            const labelId = `transfer-list-item-${option.value}-label`;
            return (
              <ListItemButton
                key={option.value}
                role={'listitem'}
                sx={{
                  padding: `0 0 0 ${theme.spacing(1)}`,
                  margin: 0,
                }}
                disabled={disabled}
                onClick={handleToggle(option.value)}
              >
                <ListItemIcon
                  sx={{
                    margin: 0,
                    padding: 0,
                    minWidth: theme.spacing(4),
                  }}
                >
                  <Checkbox
                    checked={checked.indexOf(item) !== -1}
                    disabled={disabled}
                    slotProps={{
                      input: {
                        'aria-labelledby': labelId,
                      },
                    }}
                    sx={{
                      padding: 0,
                      margin: 0,
                    }}
                    tabIndex={-1}
                  />
                </ListItemIcon>
                <ListItemText
                  id={labelId}
                  secondary={option.label}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Paper>
    );

    return (
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateRows: 'auto max-content',
          marginTop: theme.spacing(0.5),
        }}
        onBlur={onBlur}
      >
        <Box>
          <TextField
            label={t`Filter`}
            size={'small'}
            variant={'outlined'}
            onChange={onFilterValueChangeDebounced}
          />
        </Box>
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '4fr 1fr 4fr',
          }}
        >
          <Box>
            {customList(left)}
          </Box>
          <Box sx={{ height }}>
            <Grid
              container
              alignItems={'center'}
              direction={'column'}
              sx={{ height }}
            >

              <Button
                aria-label={t`move selected right`}
                size={'small'}
                sx={{ my: 0.5 }}
                variant={'outlined'}
                disabled={disabled || leftChecked.length === 0}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={onMoveRightButtonClick}
              >
                {'>'}
              </Button>
              <Button
                aria-label={t`move selected left`}
                size={'small'}
                sx={{ my: 0.5 }}
                variant={'outlined'}
                disabled={disabled || rightChecked.length === 0}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={onMoveLeftButtonClick}
              >
                {'<'}
              </Button>
              <Button
                aria-label={t`move all right`}
                size={'small'}
                sx={{ my: 0.5, mt: 2 }}
                variant={'outlined'}
                disabled={disabled || left.length === 0}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={onMoveAllRightButtonClick}
              >
                {'≫'}
              </Button>
              <Button
                aria-label={t`move all left`}
                size={'small'}
                sx={{ my: 0.5 }}
                variant={'outlined'}
                disabled={disabled || right.length === 0}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={onMoveAllLeftButtonClick}
              >
                {'≪'}
              </Button>
              <Button
                aria-label={t`reset`}
                size={'small'}
                sx={{ mt: 4 }}
                variant={'outlined'}
                disabled={disabled || options.length === 0}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={onResetButtonClick}
              >
                {t`Reset`}
              </Button>
              <Button
                size={'small'}
                sx={{ mt: 0.5 }}
                variant={'outlined'}
                aria-label={t`clear`}
                disabled={disabled}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={onMoveAllLeftButtonClick}
              >
                {t`Clear`}
              </Button>
            </Grid>
          </Box>
          <Box>
            {customList(right)}
          </Box>
        </Box>
      </Box>
    );
  }, [mappedOptions, checked, theme, t, onFilterValueChangeDebounced, height, disabled, options.length, internalOnChange, resetField, name, filterValue]);

  return (
    <FormControl
      error={hasError}
      {...TestIdUtil.createAttributes('ToggleButtonGroup', { name: name as string })}
      fullWidth
      sx={{
        margin: `${theme.spacing(2)} 0`,
      }}
    >
      <FormLabel
        component={'legend'}
        disabled={disabled || loading}
        id={id}
        required={required}
      >
        {label}
      </FormLabel>
      <Controller
        control={control}
        defaultValue={null}
        name={name}
        render={renderController}
      />
      <FormHelperText sx={{ ml: 0 }}>
        <FormFieldHelperText
          noIndent
          errorMessage={errorMessage}
          warningMessage={warningMessage}
        />
      </FormHelperText>
    </FormControl>
  );
};
