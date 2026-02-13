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


  public static parse(value: string): number {
    if (typeof value !== 'string') {
      return NaN;
    }

    let sanitizedValue = value
      .trim()
      .replace(/[^0-9,.-\s]/g, ''); // Remove all except digits, commas, periods, minus signs, and whitespace

    // if multiple commas or periods exist, assume they are thousands separators and remove them
    const periodMatchesLength = (sanitizedValue.match(/[.]/g) || []).length;
    const commaMatchesLength = (sanitizedValue.match(/[,]/g) || []).length;
    const spaceMatchesLength = (sanitizedValue.match(/[\s]/g) || []).length;

    if ([periodMatchesLength, commaMatchesLength, spaceMatchesLength].filter(count => count > 1).length > 1) {
      return NaN;
    }

    if (commaMatchesLength > 1) {
      // Remove all commas if there are multiple, assuming they are thousands separators
      // Note: remaining periods are treated as decimal separators
      return parseFloat(sanitizedValue.replace(/[,\s]/g, ''));
    }
    if (spaceMatchesLength > 1) {
      // Remove all whitespace if there are multiple, assuming they are thousands separators
      sanitizedValue = sanitizedValue.replace(/\s/g, '');
      // Note: remaining commas or periods are treated as decimal separators
      return parseFloat(sanitizedValue.replace(',', '.'));
    }
    if (periodMatchesLength > 1) {
      // Remove all periods if there are multiple, assuming they are thousands separators
      sanitizedValue = sanitizedValue.replace(/[.\s]/g, '').replace(',', '.'); // Replace remaining comma with period for decimal
      return parseFloat(sanitizedValue);
    }

    sanitizedValue = sanitizedValue.replace(/[,.\s](?=.*[,.\s])/g, '')
      .replace(',', '.');                  // Replace remaining comma with period for decimal

    return parseFloat(sanitizedValue);
  }
}
