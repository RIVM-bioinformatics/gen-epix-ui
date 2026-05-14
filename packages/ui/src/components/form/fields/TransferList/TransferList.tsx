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
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  useTheme,
} from '@mui/material';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  FieldValues,
  Path,
  UseControllerReturn,
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
  readonly height?: number;
  readonly label: string;
  readonly loading?: boolean;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly options: TransferListOption[];
  readonly required?: boolean;
  readonly warningMessage?: boolean | string;
};

export const TransferList = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  height = 500,
  label,
  loading,
  name,
  onChange: onChangeProp,
  options,
  required,
  warningMessage,
}: TransferListProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();

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

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
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
        elevation={1}
        square
        sx={{
          height,
          overflow: 'auto',
          width: '100%',
        }}
      >
        <List
          component={'div'}
          dense
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
                disabled={disabled}
                key={option.value}
                onClick={handleToggle(option.value)}
                role={'listitem'}
                sx={{
                  margin: 0,
                  padding: `0 0 0 ${theme.spacing(1)}`,
                }}
              >
                <ListItemIcon
                  sx={{
                    margin: 0,
                    minWidth: theme.spacing(4),
                    padding: 0,
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
                      margin: 0,
                      padding: 0,
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
        onBlur={onBlur}
        sx={{
          display: 'grid',
          gridTemplateRows: 'auto max-content',
          marginTop: theme.spacing(0.5),
          width: '100%',
        }}
      >
        <Box>
          <TextField
            fullWidth
            label={t`Filter`}
            onChange={onFilterValueChangeDebounced}
            size={'small'}
            variant={'outlined'}
          />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '4fr 1fr 4fr',
            width: '100%',
          }}
        >
          <Box>
            {customList(left)}
          </Box>
          <Box sx={{ height }}>
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                height,
              }}
            >

              <Button
                aria-label={t`move selected right`}
                disabled={disabled || leftChecked.length === 0}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={onMoveRightButtonClick}
                size={'small'}
                sx={{ my: 0.5 }}
                variant={'outlined'}
              >
                {'>'}
              </Button>
              <Button
                aria-label={t`move selected left`}
                disabled={disabled || rightChecked.length === 0}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={onMoveLeftButtonClick}
                size={'small'}
                sx={{ my: 0.5 }}
                variant={'outlined'}
              >
                {'<'}
              </Button>
              <Button
                aria-label={t`move all right`}
                disabled={disabled || left.length === 0}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={onMoveAllRightButtonClick}
                size={'small'}
                sx={{ mt: 2, my: 0.5 }}
                variant={'outlined'}
              >
                {'≫'}
              </Button>
              <Button
                aria-label={t`move all left`}
                disabled={disabled || right.length === 0}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={onMoveAllLeftButtonClick}
                size={'small'}
                sx={{ my: 0.5 }}
                variant={'outlined'}
              >
                {'≪'}
              </Button>
              <Button
                aria-label={t`Reset selection`}
                disabled={disabled || options.length === 0}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={onResetButtonClick}
                size={'small'}
                sx={{ mt: 4 }}
                variant={'outlined'}
              >
                {t`Reset`}
              </Button>
              <Button
                aria-label={t`clear`}
                disabled={disabled}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={onMoveAllLeftButtonClick}
                size={'small'}
                sx={{ mt: 0.5 }}
                variant={'outlined'}
              >
                {t`Clear`}
              </Button>
            </Box>
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
      {...TestIdUtil.createAttributes('ToggleButtonGroup', { name })}
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
          errorMessage={errorMessage}
          noIndent
          warningMessage={warningMessage}
        />
      </FormHelperText>
    </FormControl>
  );
};
