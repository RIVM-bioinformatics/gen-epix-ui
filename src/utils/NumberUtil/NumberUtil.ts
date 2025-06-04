export class NumberUtil {
  public static toStringWithPrecision(value: number, base: number): string {
    if (typeof value !== 'number' || !isFinite(value)) {
      return '';
    }
    const precision = base.toString().split('.')?.[1]?.length ?? 0;
    const splitValue = value.toString().split('.');

    let stringValue = splitValue[0];
    if (precision > 0) {
      stringValue = `${stringValue}.${(splitValue[1] ?? '').padEnd(precision, '0').slice(0, precision)}`;
    }
    return stringValue;
  }
}
