import type { ButtonOwnProps } from '@mui/material';
import {
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import useCleanupCallback from 'use-cleanup-callback';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import ErrorIcon from '@mui/icons-material/Error';
import type { ReactElement } from 'react';
import { useState } from 'react';

export type CopyToClipboardButtonProps = {
  readonly clipboardValue?: string;
  readonly onGetClipboardValue?: () => string;
  readonly buttonText?: string;
  readonly buttonVariant?: ButtonOwnProps['variant'];
  readonly iconOnly?: boolean;
  readonly buttonProps?: ButtonOwnProps;
  readonly tooltipSuccessText?: string;
};

export const CopyToClipboardButton = ({ clipboardValue, onGetClipboardValue, buttonText, buttonVariant, iconOnly, buttonProps, tooltipSuccessText }: CopyToClipboardButtonProps) => {
  const [t] = useTranslation();
  const [copyToClipBoardButtonColor, setCopyToClipBoardButtonColor] = useState<ButtonOwnProps['color']>('primary');
  const [copyToClipBoardIcon, setCopyToClipBoardIcon] = useState<ReactElement>(<ContentCopyIcon />);
  const [tooltipText, setTooltipText] = useState<string>(buttonText ?? t`Copy to clipboard`);


  const onCopyToClipboardButtonClick = useCleanupCallback(() => {
    let timeoutId: number;
    const perform = async () => {
      try {
        await navigator.clipboard.writeText(clipboardValue ?? onGetClipboardValue());
        setCopyToClipBoardButtonColor('success');
        setCopyToClipBoardIcon(<DoneIcon />);
        setTooltipText(tooltipSuccessText ?? t`Copied to clipboard`);
      } catch (_error: unknown) {
        setCopyToClipBoardButtonColor('error');
        setCopyToClipBoardIcon(<ErrorIcon />);
        setTooltipText(t`Error`);
      } finally {
        timeoutId = window.setTimeout(() => {
          setCopyToClipBoardButtonColor('primary');
          setCopyToClipBoardIcon(<ContentCopyIcon />);
          setTooltipText(buttonText ?? t`Copy to clipboard`);
        }, 2000);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
    return () => {
      clearTimeout(timeoutId);
    };
  }, [buttonText, clipboardValue, onGetClipboardValue, t, tooltipSuccessText]);

  if (iconOnly) {
    return (
      <Tooltip
        arrow
        placement="top"
        title={tooltipText}
      >
        <IconButton
          {...buttonProps}
          color={copyToClipBoardButtonColor}
          onClick={onCopyToClipboardButtonClick}
          size="small"
        >
          {copyToClipBoardIcon}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      {...buttonProps}
      color={copyToClipBoardButtonColor}
      onClick={onCopyToClipboardButtonClick}
      startIcon={copyToClipBoardIcon}
      variant={buttonVariant ?? 'contained'}
    >
      {buttonText ?? t`Copy to clipboard`}
    </Button>
  );
};
