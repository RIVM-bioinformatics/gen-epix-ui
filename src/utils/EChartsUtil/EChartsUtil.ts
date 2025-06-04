import type { ECharts } from 'echarts';

import { DataUrlUtil } from '../DataUrlUtil';

export class EChartsUtil {
  public static downloadImage(instance: ECharts, type: 'jpeg' | 'png', name: string): void {
    const url = instance.getDataURL({
      type,
      pixelRatio: 2,
      backgroundColor: '#fff',
    });
    DataUrlUtil.downloadUrl(url, name);
  }
}
