import { useEffect } from 'react';

import { ConfigService } from '../../classes/services/ConfigService';


export const useUpdateDocumentTitle = (title: string) => {
  useEffect(() => {
    document.title = `${ConfigService.getInstance().config.applicationName} - ${title}`;
  }, [title]);
};
