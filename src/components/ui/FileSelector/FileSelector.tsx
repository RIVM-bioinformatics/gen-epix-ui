import {
  Typography,
  Box,
} from '@mui/material';
import type {
  ChangeEvent,
  DragEvent,
} from 'react';
import {
  useCallback,
  useId,
  useState,
} from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { useTranslation } from 'react-i18next';

export type FileSelectorProps = {
  readonly accept: string;
  readonly onFileListChange: (files: FileList | null) => void;
  readonly numFilesAllowed?: number;
};

export const FileSelector = ({
  accept,
  onFileListChange,
  numFilesAllowed = 1,
}: FileSelectorProps) => {
  const [t] = useTranslation();
  const hoverLabel = numFilesAllowed === 1
    ? t('Click or drag to upload file ({{accept}})', { accept: accept.split(',').join(', ') })
    : t('Click or drag to upload files  ({{accept}})', { accept: accept.split(',').join(', ') });
  const dropLabel = numFilesAllowed === 1
    ? t`Drop file here`
    : t`Drop files here`;

  const inputId = useId();

  const [uploadComplete, setUploadComplete] = useState(false);
  const [labelText, setLabelText] = useState<string>(hoverLabel);
  const [errorText, setErrorText] = useState<string>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const stopDefaults = useCallback((e: DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const onDragEnter = useCallback((event: DragEvent) => {
    setErrorText(null);
    stopDefaults(event);
    setIsDragOver(true);
    setLabelText(dropLabel);
  }, [stopDefaults, dropLabel]);

  const onDragLeave = useCallback((event: DragEvent) => {
    stopDefaults(event);
    setIsDragOver(false);
    setLabelText(hoverLabel);
  }, [stopDefaults, hoverLabel]);

  const onDragOver = useCallback((event: DragEvent) => {
    stopDefaults(event);
  }, [stopDefaults]);

  const areFileTypesValid = useCallback((fileList: FileList) => {
    for (const file of fileList) {
      const isValid = accept.split(',').some(type => {
        const trimmedType = type.trim();
        return (
          trimmedType === file.type ||
          (trimmedType.startsWith('.') && file.name.endsWith(trimmedType))
        );
      });
      if (!isValid) {
        return false;
      }
    }
    return true;
  }, [accept]);

  const onDrop = useCallback((event: DragEvent<HTMLElement>) => {
    stopDefaults(event);
    setLabelText(hoverLabel);
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      if (files.length > numFilesAllowed) {
        setErrorText(`Too many files selected. Maximum allowed: ${numFilesAllowed}`);
        return;
      }

      if (!areFileTypesValid(files)) {
        setErrorText(`Invalid file type. Accepted types: ${accept}`);
        return;
      }
      setUploadComplete(true);
    }

    onFileListChange(files);
  }, [stopDefaults, hoverLabel, onFileListChange, numFilesAllowed, areFileTypesValid, accept]);

  const onFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setErrorText(null);
    const files = event.target.files;

    if (files && files.length > 0) {
      if (files.length > numFilesAllowed) {
        setErrorText(`Too many files selected. Maximum allowed: ${numFilesAllowed}`);
        event.target.value = ''; // Clear the input
        return;
      }

      if (!areFileTypesValid(files)) {
        setErrorText(`Invalid file type. Accepted types: ${accept}`);
        event.target.value = ''; // Clear the input
        return;
      }

      setUploadComplete(true);
    }

    onFileListChange(files);
  }, [onFileListChange, numFilesAllowed, areFileTypesValid, accept]);

  const onUploadCompleteButtonClick = useCallback(() => {
    setUploadComplete(false);
  }, []);

  if (uploadComplete) {
    return (
      <Box sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      >
        <CloudDoneIcon
          color={'primary'}
          fontSize="large"
          onClick={onUploadCompleteButtonClick}
          sx={{
            cursor: 'pointer',
          }}
        />
        <Typography>{t`Complete`}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        accept={accept}
        component={'input'}
        id={inputId}
        multiple={numFilesAllowed > 1}
        onChange={onFileInputChange}
        sx={{
          display: 'none',
        }}
        type="file"
      />

      <Box
        component={'label'}
        htmlFor={inputId}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          '& p, & svg': {
            opacity: isDragOver ? 1 : 0.4,
          },
          '&:hover *': {
            opacity: 1,
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'absolute',
            }}
          >
            <CloudUploadIcon
              color={'primary'}
              fontSize="large"
            />
            {errorText && (
              <Typography sx={{
                color: 'error.main',
                fontWeight: 'bold',
              }}
              >{errorText}
              </Typography>
            )}
            <Typography>{labelText}</Typography>

          </Box>
        </Box>
      </Box>
    </>
  );
};
