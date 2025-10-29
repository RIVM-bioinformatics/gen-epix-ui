import {
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type {
  ChangeEvent,
  DragEvent,
} from 'react';
import {
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { FileUtil } from '../../../utils/FileUtil';
import { DATE_FORMAT } from '../../../data/date';


export type FileSelectorProps = {
  readonly accept: string;
  readonly onDataTransferChange: (dataTransfer: DataTransfer) => void;
  readonly numFilesAllowed?: number;
  readonly initialDataTransfer?: DataTransfer;
};

export const FileSelector = ({
  accept,
  onDataTransferChange,
  numFilesAllowed = 1,
  initialDataTransfer: initialDataTransferProp,
}: FileSelectorProps) => {
  const [t] = useTranslation();
  const hoverLabel = numFilesAllowed === 1
    ? t('Click or drag to upload file ({{accept}})', { accept: accept.split(',').join(', ') })
    : t('Click or drag to upload files  ({{accept}})', { accept: accept.split(',').join(', ') });
  const dropLabel = numFilesAllowed === 1
    ? t`Drop file here`
    : t`Drop files here`;

  const inputId = useId();

  const initialDataTransfer = useMemo(() => {
    return initialDataTransferProp ?? new DataTransfer();
  }, [initialDataTransferProp]);

  const [dataTransfer, setDataTransfer] = useState<DataTransfer>(initialDataTransfer);
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

  const removeFile = useCallback((fileName: string) => {
    setErrorText(null);
    setDataTransfer((oldDataTransfer) => {
      const newDataTransfer = new DataTransfer();
      Array.from(oldDataTransfer.files)
        .filter(f => f.name !== fileName)
        .forEach(f => newDataTransfer.items.add(f));
      onDataTransferChange(newDataTransfer);
      return newDataTransfer;
    });
  }, [onDataTransferChange]);

  const addFileList = useCallback((fileList: FileList) => {
    setErrorText(null);
    setDataTransfer((oldDataTransfer) => {
      if (!fileList || fileList.length === 0) {
        return oldDataTransfer;
      }
      if (!areFileTypesValid(fileList)) {
        setErrorText(`Invalid file type. Accepted types: ${accept}`);
        return oldDataTransfer;
      }

      const fileNamesToAppend = Array.from(fileList).map(f => f.name);
      const uniqueOldFileNames = new Set(Array.from(oldDataTransfer.files).map(f => f.name));
      const numDuplicates = fileNamesToAppend.filter(name => uniqueOldFileNames.has(name)).length;
      const numNewFileNames = uniqueOldFileNames.size + (fileNamesToAppend.length - numDuplicates);

      if (numNewFileNames > numFilesAllowed) {
        setErrorText(`Too many files selected. Maximum allowed: ${numFilesAllowed}`);
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

      onDataTransferChange(newDataTransfer);
      return newDataTransfer;

    });
  }, [accept, areFileTypesValid, numFilesAllowed, onDataTransferChange]);

  const onDrop = useCallback((event: DragEvent<HTMLElement>) => {
    stopDefaults(event);
    setLabelText(hoverLabel);
    setIsDragOver(false);

    const fileList = event.dataTransfer.files;
    addFileList(fileList);

  }, [stopDefaults, hoverLabel, addFileList]);

  const onFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    addFileList(event.target.files);
  }, [addFileList]);

  const onClearAllButtonClick = useCallback(() => {
    setErrorText(null);
    setDataTransfer(new DataTransfer());
    onDataTransferChange(new DataTransfer());
  }, [onDataTransferChange]);

  return (
    <>
      <Box
        accept={accept}
        component={'input'}
        id={inputId}
        multiple={numFilesAllowed > 1}
        sx={{
          display: 'none',
        }}
        type={'file'}
        onChange={onFileInputChange}
      />
      <Box
        sx={{
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto fit-content(50%)',
        }}
      >
        <Box
          component={'label'}
          htmlFor={inputId}
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
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
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
                    position: 'sticky',
                    top: 0,
                    paddingY: 1,
                    backgroundColor: (theme) => theme.palette.background.paper,
                    zIndex: (theme) => theme.zIndex.tooltip - 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant={'h5'}
                  >
                    {t('Selected files: {{numFiles}}', { numFiles: dataTransfer.files.length })}
                  </Typography>
                  <IconButton
                    aria-label={t('Clear all selected files')}
                    size={'small'}
                    onClick={onClearAllButtonClick}
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
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      icon={<InsertDriveFileIcon />}
                      sx={{
                        margin: 0.25,
                      }}
                      variant={'outlined'}
                      label={
                        (
                          <>
                            <strong>
                              {file.name}
                            </strong>
                            <span>
                              {' '}
                              {t('(size: {{size}})', { size: FileUtil.getReadableFileSize(file.size) })}
                              {' '}
                              {t('(last modified: {{lastModified}})', { lastModified: format(new Date(file.lastModified), DATE_FORMAT.DATE_TIME) })}
                            </span>
                          </>
                        )
                      }
                      deleteIcon={<DeleteIcon />}
                      // eslint-disable-next-line react/jsx-no-bind
                      onDelete={() => removeFile(file.name)}
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
