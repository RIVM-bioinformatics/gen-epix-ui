import type {
  DialogProps as MuiDialogProps,
  TypographyVariant,
} from '@mui/material';
import {
  Box,
  Dialog as MuiDialog,
  DialogActions as MuiDialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  type ReactElement,
  type PropsWithChildren,
  useCallback,
} from 'react';
import isObject from 'lodash/isObject';

import { CopyToClipboardButton } from '../CopyToClipboardButton';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export type DialogActionButton = Omit<Parameters<typeof Button>[0], 'children'> & {
  label: string;
};

export type DialogAction = DialogActionButton | ReactElement;

export type DialogProps = {
  readonly onClose?: () => void;
  readonly component?: (props: { onDialogTitleChange?: (title: string) => void }) => ReactElement;
  readonly title?: string;
  readonly titleVariant?: TypographyVariant;
  readonly permalink?: string;
  readonly actionButtons?: () => ReactElement;
  readonly actions?: DialogAction[];
  readonly testId: string;
  readonly maxWidth?: MuiDialogProps['maxWidth'];
  readonly fullWidth?: boolean;
  readonly fullScreen?: boolean;
  readonly noCloseButton?: boolean;
  readonly disableBackdropClick?: boolean;
  readonly noTitle?: boolean;
  readonly noPadding?: boolean;
};

const isDialogActionButton = (action: DialogAction): action is DialogActionButton => {
  return isObject(action) && 'label' in action;
};

export const Dialog = ({
  onClose,
  title,
  children,
  actionButtons: ActionButtons,
  actions,
  testId,
  titleVariant = 'h5',
  permalink,
  maxWidth = false,
  fullWidth = false,
  noCloseButton = false,
  disableBackdropClick = false,
  fullScreen = false,
  noTitle = false,
  noPadding = false,
}: PropsWithChildren<DialogProps>): ReactElement => {
  const onMuiDialogClose = useCallback((_event: unknown, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick' && disableBackdropClick) {
      return;
    }
    onClose();
  }, [disableBackdropClick, onClose]);

  const onGetClipboardValue = useCallback(() => {
    return permalink;
  }, [permalink]);

  return (
    <MuiDialog
      {...TestIdUtil.createAttributes(testId, { title })}
      disableEscapeKeyDown={disableBackdropClick}
      fullScreen={fullScreen}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      onClose={onMuiDialogClose}
      open
      sx={{
        '& .MuiDialogContent-root, & .MuiCardContent-root:last-child': {
          padding: noPadding ? '0' : undefined,
        },
      }}
    >
      {!noTitle && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
        >
          <DialogTitle
            {...TestIdUtil.createAttributes(`${testId}-title`)}
            sx={{
              pr: 3,
              '& .genepix-permalink': {
                display: 'none',
                position: 'absolute',
              },
              '&:hover .genepix-permalink': {
                display: 'inline-block',
              },
            }}
            variant={titleVariant}
          >
            {title}
            {permalink && (
              <Box
                className="genepix-permalink"
                sx={{
                  display: 'inline-block',
                  marginLeft: 1,
                }}
              >
                <CopyToClipboardButton
                  buttonProps={{
                    sx: {
                      width: 16,
                      height: 16,
                      '& svg': {
                        fontSize: 16,
                      },
                    },
                  }}
                  iconOnly
                  onGetClipboardValue={onGetClipboardValue}
                />
              </Box>
            )}
          </DialogTitle>
          {!noCloseButton && (
            <IconButton
              {...TestIdUtil.createAttributes(`${testId}-closeButton`)}
              onClick={onClose}
              sx={{
                color: 'grey.500',
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      )}
      {!!children && (
        <DialogContent
          {...TestIdUtil.createAttributes(`${testId}-content`)}
          dividers={!!ActionButtons}
          sx={{
            paddingTop: fullScreen ? 0 : undefined,
          }}
        >
          {children}
        </DialogContent>
      )}
      {actions?.length > 0 && (
        <MuiDialogActions {...TestIdUtil.createAttributes(`${testId}-actions`)}>
          <Box
            sx={{
              '& > button': {
                margin: 1,
              },
            }}
          >
            {actions.map((action) => {
              if (isDialogActionButton(action)) {
                return (
                  <Button
                    key={action.label}
                    {...action}
                  >
                    {action.label}
                  </Button>
                );
              }
              return action;
            })}
          </Box>
        </MuiDialogActions>
      )}
    </MuiDialog>
  );
};
