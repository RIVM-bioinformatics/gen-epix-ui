import type { TypographyProps } from '@mui/material';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { useTableStoreContext } from '../../../stores/tableStore';

export type TableCaptionProps = {
  readonly caption: string;
  readonly component?: TypographyProps['component'];
  readonly variant: TypographyProps['variant'];
};

export const TableCaption = <TRowData, TDataContext = null>({ caption, component = 'h2', variant = 'h2' }: TableCaptionProps) => {
  const { t } = useTranslation();
  const tableStore = useTableStoreContext<TRowData, TDataContext>();
  const baseDataLength = useStore(tableStore, (state) => state.baseData.length);
  const sortedDataLength = useStore(tableStore, useShallow((state) => state.sortedData.length));

  return (
    <Typography
      component={component}
      variant={variant}
    >
      <>
        {sortedDataLength === 0 && (caption ?? t('Items'))}
        {sortedDataLength > 0 && sortedDataLength === baseDataLength && t('{{items}} ({{count}})', { count: sortedDataLength, items: caption ?? t('Items'), totalCount: baseDataLength })}
        {sortedDataLength > 0 && sortedDataLength !== baseDataLength && t('{{items}} ({{count}} of {{totalCount}})', { count: sortedDataLength, items: caption ?? t('Items'), totalCount: baseDataLength })}
      </>
    </Typography>
  );
};
