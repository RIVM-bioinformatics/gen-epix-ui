import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { DATE_FORMAT } from '@gen-epix/ui';

import { FileUtil } from '../../../utils/FileUtil';


export type FileSelectorProps = {
  readonly accept: string;
  readonly initialDataTransfer?: DataTransfer;
  readonly numFilesAllowed?: number;
  readonly onDataTransferChange: (dataTransfer: DataTransfer) => void;
};

export const FileSelector = ({
  accept,
  initialDataTransfer: initialDataTransferProp,
  numFilesAllowed = 1,
  onDataTransferChange,
}: FileSelectorProps) => {
  const { t } = useTranslation();
  const hoverLabel = numFilesAllowed === 1
    ? t('Click or drag to upload file ({{accept}})', { accept: accept.split(',').join(', ') })
    : t('Click or drag to upload files  ({{accept}})', { accept: accept.split(',').join(', ') });
  const dropLabel = numFilesAllowed === 1
    ? t`Drop file here`
    : t`Drop files here`;

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialDataTransfer = useMemo(() => {
    return initialDataTransferProp ?? new DataTransfer();
  }, [initialDataTransferProp]);

  const [dataTransfer, setDataTransfer] = useState<DataTransfer>(initialDataTransfer);
  const [labelText, setLabelText] = useState<string>(hoverLabel);
  const [errorText, setErrorText] = useState<string>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const initialDataTransferEffectRef = useRef(true);

  useEffect(() => {
    if (initialDataTransferEffectRef.current) {
      initialDataTransferEffectRef.current = false;
      return;
    }
    onDataTransferChange(dataTransfer);
  }, [dataTransfer, onDataTransferChange]);

  const stopDefaults = useCallback((e: DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const onLabelDragEnter = useCallback((event: DragEvent) => {
    setErrorText(null);
    stopDefaults(event);
    setIsDragOver(true);
    setLabelText(dropLabel);
  }, [stopDefaults, dropLabel]);

  const onLabelDragLeave = useCallback((event: DragEvent) => {
    stopDefaults(event);
    setIsDragOver(false);
    setLabelText(hoverLabel);
  }, [stopDefaults, hoverLabel]);

  const onLabelDragOver = useCallback((event: DragEvent) => {
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

  const removeFile = useCallback((fileName: string) => {
    setErrorText(null);
    setDataTransfer((oldDataTransfer) => {
      const newDataTransfer = new DataTransfer();
      Array.from(oldDataTransfer.files)
        .filter(f => f.name !== fileName)
        .forEach(f => newDataTransfer.items.add(f));
      return newDataTransfer;
    });
  }, []);

  const addFileList = useCallback((fileList: FileList) => {
    setErrorText(null);
    setDataTransfer((oldDataTransfer) => {
      if (!fileList || fileList.length === 0) {
        return oldDataTransfer;
      }
      if (!areFileTypesValid(fileList)) {
        setErrorText(t('Invalid file type. Accepted types: {{accept}}', { accept }));
        return oldDataTransfer;
      }

      const fileNamesToAppend = Array.from(fileList).map(f => f.name);
      const uniqueOldFileNames = new Set(Array.from(oldDataTransfer.files).map(f => f.name));
      const numDuplicates = fileNamesToAppend.filter(name => uniqueOldFileNames.has(name)).length;
      const numNewFileNames = uniqueOldFileNames.size + (fileNamesToAppend.length - numDuplicates);

      if (numNewFileNames > numFilesAllowed) {
        setErrorText(t('Too many files selected. Maximum allowed: {{numFilesAllowed}}', { numFilesAllowed }));
        return oldDataTransfer;
      }

      const newDataTransfer = new DataTransfer();
      Array.from(oldDataTransfer.files).forEach(file => {
        if (!fileNamesToAppend.includes(file.name)) {
          newDataTransfer.items.add(file);
        }
      });
      Array.from(fileList).forEach(file => {
        newDataTransfer.items.add(file);
      });

      return newDataTransfer;

    });
  }, [accept, areFileTypesValid, numFilesAllowed, t]);

  const onDrop = useCallback((event: DragEvent<HTMLElement>) => {
    stopDefaults(event);
    setLabelText(hoverLabel);
    setIsDragOver(false);

    const fileList = event.dataTransfer.files;
    addFileList(fileList);

  }, [stopDefaults, hoverLabel, addFileList]);

  const onLabelKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const onFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    addFileList(event.target.files);
  }, [addFileList]);

  const onClearAllButtonClick = useCallback(() => {
    setErrorText(null);
    setDataTransfer(new DataTransfer());
  }, []);

  return (
    <>
      <Box
        accept={accept}
        component={'input'}
        id={inputId}
        multiple={numFilesAllowed > 1}
        onChange={onFileInputChange}
        ref={inputRef}
        sx={{
          display: 'none',
        }}
        type={'file'}
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: 'auto fit-content(50%)',
          height: '100%',
        }}
      >
        <Box
          component={'label'}
          htmlFor={inputId}
          onDragEnter={onLabelDragEnter}
          onDragLeave={onLabelDragLeave}
          onDragOver={onLabelDragOver}
          onDrop={onDrop}
          onKeyDown={onLabelKeyDown}
          sx={{
            '&:hover *': {
              opacity: 1,
            },
            '& p, & svg': {
              opacity: isDragOver ? 1 : 0.4,
            },
            cursor: 'pointer',
            display: 'flex',
            height: '100%',
            position: 'relative',
            textAlign: 'center',
            width: '100%',
          }}
          tabIndex={0}
        >
          <Box
            sx={{
              height: '100%',
              pointerEvents: 'none',
              position: 'relative',
              width: '100%',
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'center',
                position: 'absolute',
                width: '100%',
              }}
            >
              <CloudUploadIcon
                color={'primary'}
                fontSize={'large'}
              />
              {errorText && (
                <Typography
                  sx={{
                    color: 'error.main',
                    fontWeight: 'bold',
                  }}
                >
                  {errorText}
                </Typography>
              )}
              <Typography>
                {labelText}
              </Typography>

            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <Box>
            {dataTransfer.files.length > 0 && (
              <>
                <Box
                  sx={{
                    alignItems: 'center',
                    backgroundColor: (theme) => theme.palette.background.paper,
                    display: 'flex',
                    gap: 1,
                    paddingY: 1,
                    position: 'sticky',
                    top: 0,
                    zIndex: (theme) => theme.zIndex.tooltip - 1,
                  }}
                >
                  <Typography
                    variant={'h5'}
                  >
                    {t('Selected files: {{numFiles}}', { numFiles: dataTransfer.files.length })}
                  </Typography>
                  <IconButton
                    aria-label={t('Clear all selected files')}
                    onClick={onClearAllButtonClick}
                    size={'small'}
                  >
                    <DeleteIcon fontSize={'small'} />
                  </IconButton>
                </Box>
                <Stack
                  direction={'row'}
                  sx={{
                    flexWrap: 'wrap',
                  }}
                >
                  {Array.from(dataTransfer.files).map(file => (
                    <Chip
                      deleteIcon={(
                        <DeleteIcon
                          aria-hidden={false}
                          aria-label={t('Clear {{fileName}}', { fileName: file.name })}
                          focusable
                          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              removeFile(file.name);
                            }
                          }}
                          tabIndex={0}
                        />
                      )}
                      icon={<InsertDriveFileIcon />}
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      label={
                        (
                          <>
                            <Box
                              component={'span'}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {file.name}
                            </Box>
                            <Box component={'span'}>
                              {' '}
                              {t('(size: {{size}})', { size: FileUtil.getReadableFileSize(file.size) })}
                              {' '}
                              {t('(last modified: {{lastModified}})', { lastModified: format(new Date(file.lastModified), DATE_FORMAT.DATE_TIME) })}
                            </Box>
                          </>
                        )
                      }
                      // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                      onDelete={() => {
                        removeFile(file.name);
                      }}
                      sx={{
                        margin: 0.25,
                      }}
                      tabIndex={-1}
                      variant={'outlined'}
                    />
                  ))}
                </Stack>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};
