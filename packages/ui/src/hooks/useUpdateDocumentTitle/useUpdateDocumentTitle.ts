import { useEffect } from 'react';

import { ConfigManager } from '../../classes/managers/ConfigManager';


export const useUpdateDocumentTitle = (title: string) => {
  useEffect(() => {
    document.title = `${ConfigManager.getInstance().config.applicationName} - ${title}`;
  }, [title]);
};
