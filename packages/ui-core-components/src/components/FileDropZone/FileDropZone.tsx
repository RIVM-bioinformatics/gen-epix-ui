import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  Ref,
} from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  Box,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useTranslation } from 'react-i18next';
import { FileUtil } from '@gen-epix/ui-core/utils/FileUtil';

export interface FileDropZoneProps {
  readonly accept: string;
  readonly ariaDescribedBy?: string;
  readonly disabled?: boolean;
  readonly error?: boolean;
  readonly files: FileList | null;
  readonly helperText?: string;
  readonly label?: string;
  readonly labelledById?: string;
  readonly multiple?: boolean;
  readonly onBlur?: () => void;
  readonly onFilesSelected: (files: FileList) => void;
  readonly ref?: Ref<HTMLDivElement>;
}

export const FileDropZone = ({
  accept,
  ariaDescribedBy,
  disabled,
  error,
  files,
  helperText,
  label,
  labelledById,
  multiple = false,
  onBlur,
  onFilesSelected,
  ref,
}: FileDropZoneProps) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();

  const translatedLabel = multiple
    ? t('{{label}} ({{accept}})', { accept: accept.split(',').join(', '), label })
    : t('{{label}} ({{accept}})', { accept: accept.split(',').join(', '), label });

  useEffect(() => {
    // allows re-selecting the same file after it was cleared externally
    if (!files && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [files]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (disabled) {
      return;
    }
    setIsDragOver(true);
  }, [disabled]);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) {
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [disabled, onFilesSelected]);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  }, [onFilesSelected]);

  const onClick = useCallback(() => {
    if (disabled) {
      return;
    }
    inputRef.current?.click();
  }, [disabled]);

  const onKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (disabled) {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, [disabled]);

  const selectedFiles = files ? Array.from(files) : [];
  const hasFiles = selectedFiles.length > 0;
  const totalSize = selectedFiles.reduce((sum, currentFile) => sum + currentFile.size, 0);

  let backgroundColor = 'background.paper';
  let borderColor = 'divider';
  if (disabled) {
    backgroundColor = 'action.disabledBackground';
    borderColor = 'action.disabled';
  } else if (isDragOver) {
    backgroundColor = 'action.hover';
    borderColor = 'primary.main';
  } else if (error) {
    borderColor = 'error.main';
  }

  return (
    <Box
      aria-describedby={ariaDescribedBy ? `${ariaDescribedBy} ${descriptionId}` : descriptionId}
      aria-disabled={disabled}
      aria-label={labelledById ? undefined : translatedLabel}
      aria-labelledby={labelledById}
      onBlur={onBlur}
      onClick={onClick}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      ref={ref}
      role={'button'}
      sx={{
        '&:focus-visible': {
          borderColor: 'primary.main',
          borderStyle: 'solid',
        },
        alignItems: 'center',
        backgroundColor,
        border: '2px dashed',
        borderColor,
        borderRadius: 2,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        justifyContent: 'center',
        minHeight: 180,
        opacity: disabled ? 0.6 : 1,
        padding: 3,
        pointerEvents: disabled ? 'none' : 'auto',
        textAlign: 'center',
        transition: 'all 0.2s ease',
      }}
      tabIndex={disabled ? -1 : 0}
    >
      <input
        accept={accept}
        disabled={disabled}
        multiple={multiple}
        onChange={onFileChange}
        ref={inputRef}
        style={{ display: 'none' }}
        type={'file'}
      />
      <span
        id={descriptionId}
        style={visuallyHidden}
      >
        {translatedLabel}
        {helperText ? ` ${helperText}` : ''}
      </span>
      <Box
        aria-atomic
        aria-live={'polite'}
        component={'span'}
        sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        {hasFiles ? (
          <>
            <InsertDriveFileOutlinedIcon
              color={'primary'}
              sx={{ fontSize: 40 }}
            />
            <Typography
              color={'success.main'}
              sx={{ fontWeight: 600 }}
              variant={'subtitle1'}
            >
              {selectedFiles.map((currentFile) => currentFile.name).join(', ')}
            </Typography>
            <Typography
              color={'text.secondary'}
              variant={'caption'}
            >
              {FileUtil.getReadableFileSize(totalSize)}
              {' — '}
              {t('Click or drag to replace')}
            </Typography>
          </>
        ) : (
          <>
            <CloudUploadOutlinedIcon
              color={'primary'}
              sx={{ fontSize: 44 }}
            />
            <Typography
              sx={{ fontWeight: 600 }}
              variant={'subtitle1'}
            >
              {translatedLabel}
            </Typography>
            <Typography
              color={'text.secondary'}
              variant={'body2'}
            >
              {helperText || t('Drag & drop your file here, or click to browse')}
            </Typography>
            <Box
              aria-hidden
              component={'span'}
              sx={{
                border: '1px solid',
                borderColor: disabled ? 'action.disabled' : 'primary.main',
                borderRadius: 1,
                color: disabled ? 'action.disabled' : 'primary.main',
                fontSize: '0.8125rem',
                fontWeight: 500,
                letterSpacing: '0.02857em',
                mt: 1,
                padding: '5px 14px',
                textTransform: 'uppercase',
              }}
            >
              {t('Choose File')}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};
