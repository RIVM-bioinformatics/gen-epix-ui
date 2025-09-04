import {
  useCallback,
  useState,
} from 'react';
import { Box } from '@mui/system';
import { parse } from 'csv/browser/esm/sync';
import readXlsxFile from 'read-excel-file';
import {
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { FileSelector } from '../../ui/FileSelector';


export type EpiUploadSelectFileProps = {
  readonly onFileChange: (data: string[][]) => void;
};

export const EpiUploadSelectFile = ({ onFileChange }: EpiUploadSelectFileProps) => {
  const [t] = useTranslation();
  const [rawData, setRawData] = useState<string[][] | null>(null);

  const onFileSelectorFileListChange = useCallback(async (fileList: FileList) => {
    if (!fileList?.[0]) {
      return;
    }
    const file = fileList[0];
    const fileName = file.name.toLowerCase();

    try {
      let parsedData: string[][];

      if (fileName.endsWith('.csv')) {
        // Parse CSV file
        const text = await file.text();
        parsedData = parse(text, {
          columns: false, // Keep as array of arrays
          skip_empty_lines: true,
          trim: true,
        });
      } else if (fileName.endsWith('.xlsx')) {
        // Parse Excel file
        const excelData = await readXlsxFile(file);
        // Convert CellValue[][] to string[][]
        parsedData = excelData.map(row => row.map(cell => cell?.toString() || ''));
      } else {
        throw new Error('Unsupported file format. Please select a CSV or Excel file.');
      }

      // Call the callback with parsed data
      setRawData(parsedData);
    } catch (error) {
      console.error('Error parsing file:', error);
    }
  }, [setRawData]);

  const onResetButtonClick = useCallback(() => {
    setRawData(null);
  }, []);

  const onProceedButtonClick = useCallback(() => {
    if (rawData) {
      onFileChange(rawData);
    }
  }, [rawData, onFileChange]);

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      position: 'relative',
    }}
    >
      {!rawData && (
        <FileSelector
          accept=".csv,.xlsx"
          onFileListChange={onFileSelectorFileListChange}
        />
      )}

      {rawData && (
        <Box marginY={2}>
          <Typography
            component={'p'}
            marginY={8}
            sx={{
              textAlign: 'center',
            }}
          >
            {t('File loaded with {{rowCount}} rows and {{colCount}} columns.', { rowCount: rawData.length - 1, colCount: rawData[0]?.length || 0 })}
          </Typography>
          <Box sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
          >
            <Button
              onClick={onResetButtonClick}
              variant={'outlined'}
            >
              {t('Start over')}
            </Button>
            <Button
              onClick={onProceedButtonClick}
              variant={'contained'}
            >
              {t('Proceed')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
