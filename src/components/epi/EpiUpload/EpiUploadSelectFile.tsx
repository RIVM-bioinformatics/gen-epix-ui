import { Box } from '@mui/system';

import { FileSelector } from '../../ui/FileSelector';

export const EpiUploadSelectFile = () => {
  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      position: 'relative',
    }}
    >
      <FileSelector
        accept=".csv,.xlsx"
        // eslint-disable-next-line react/jsx-no-bind
        onFileListChange={(fileList) => {
          console.log(fileList);
        }}
      />
    </Box>
  );
};
