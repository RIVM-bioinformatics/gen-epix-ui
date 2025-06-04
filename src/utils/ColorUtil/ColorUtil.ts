import { hexToRgb } from '@mui/system';

export class ColorUtil {
  public static hexToRgba(hex: string, opacity = 1): string {
    return hexToRgb(`${hex}${Math.round(Math.min(Math.max(opacity ?? 1, 0), 1) * 255).toString(16).toUpperCase()}`);
  }
}
