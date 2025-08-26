import type { TypographyProps } from '@mui/material';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { useTableStoreContext } from '../../../stores/tableStore';

export type TableCaptionProps = {
  readonly caption: string;
  readonly variant: TypographyProps['variant'];
  readonly component?: TypographyProps['component'];
};

export const TableCaption = <TRowData,>({ caption, variant = 'h2', component = 'h2' }: TableCaptionProps) => {
  const [t] = useTranslation();
  const tableStore = useTableStoreContext<TRowData>();
  const baseDataLength = useStore(tableStore, (state) => state.baseData.length);
  const sortedDataLength = useStore(tableStore, useShallow((state) => state.sortedData.length));

  return (
    <Typography
      component={component}
      variant={variant}
    >
      <>
        {sortedDataLength === 0 && (caption ?? t(`Items`))}
        {sortedDataLength > 0 && sortedDataLength === baseDataLength && t('{{items}} ({{count}})', { items: caption ?? t('Items'), count: sortedDataLength, totalCount: baseDataLength })}
        {sortedDataLength > 0 && sortedDataLength !== baseDataLength && t('{{items}} ({{count}} of {{totalCount}})', { items: caption ?? t('Items'), count: sortedDataLength, totalCount: baseDataLength })}
      </>
    </Typography>
  );
};
