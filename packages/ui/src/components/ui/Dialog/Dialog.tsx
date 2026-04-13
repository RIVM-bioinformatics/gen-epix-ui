import type {
  DialogProps as MuiDialogProps,
  TypographyVariant,
} from '@mui/material';
import {
  Box,
  Button,
  DialogContent,
  DialogTitle,
  IconButton,
  Dialog as MuiDialog,
  DialogActions as MuiDialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import isObject from 'lodash/isObject';
import type {
  PropsWithChildren,
  ReactElement,
  RefObject,
} from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { CopyToClipboardButton } from '../CopyToClipboardButton';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export type DialogAction = DialogActionButton | ReactElement;

export type DialogActionButton = {
  label: string;
} & Omit<Parameters<typeof Button>[0], 'children'>;

export type DialogProps = {
  readonly actionButtons?: () => ReactElement;
  readonly actions?: DialogAction[];
  readonly component?: (props: { onDialogTitleChange?: (title: string) => void }) => ReactElement;
  readonly dialogContentRef?: RefObject<HTMLDivElement>;
  readonly disableBackdropClick?: boolean;
  readonly fullScreen?: boolean;
  readonly fullWidth?: boolean;
  readonly maxWidth?: MuiDialogProps['maxWidth'];
  readonly noCloseButton?: boolean;
  readonly noPadding?: boolean;
  readonly noTitle?: boolean;
  readonly onClose?: () => void;
  readonly permalink?: string;
  readonly testId: string;
  readonly title?: string;
  readonly titleVariant?: TypographyVariant;
};

const isDialogActionButton = (action: DialogAction): action is DialogActionButton => {
  return isObject(action) && 'label' in action;
};

export const Dialog = ({
  actionButtons: ActionButtons,
  actions,
  children,
  dialogContentRef,
  disableBackdropClick = false,
  fullScreen = false,
  fullWidth = false,
  maxWidth = false,
  noCloseButton = false,
  noPadding = false,
  noTitle = false,
  onClose,
  permalink,
  testId,
  title,
  titleVariant = 'h5',
}: PropsWithChildren<DialogProps>): ReactElement => {
  const { t } = useTranslation();
  const onMuiDialogClose = useCallback<NonNullable<MuiDialogProps['onClose']>>((_event, reason) => {
    if (disableBackdropClick && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    onClose?.();
  }, [disableBackdropClick, onClose]);

  const onGetClipboardValue = useCallback(() => {
    return permalink;
  }, [permalink]);

  return (
    <MuiDialog
      {...TestIdUtil.createAttributes(testId, { title })}
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <DialogTitle
            {...TestIdUtil.createAttributes(`${testId}-title`)}
            sx={{
              pr: 3,
            }}
            variant={titleVariant}
          >
            {title}
            {permalink && (
              <Box
                className={'genepix-permalink'}
                sx={{
                  display: 'inline-block',
                  marginLeft: 1,
                }}
              >
                <CopyToClipboardButton
                  baseIcon={<LinkIcon />}
                  buttonProps={{
                    sx: {
                      '& svg': {
                        fontSize: 20,
                      },
                      height: 20,
                      width: 20,
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
              aria-label={title ? t('Close dialog with title: {{title}}', { title }) : t`Close dialog`}
              onClick={onClose}
              sx={{
                color: 'grey.500',
              }}
              title={t`Close`}
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
          ref={dialogContentRef}
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
