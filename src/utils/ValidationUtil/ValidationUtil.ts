const VALIDATION_PATTERN = {
  DECIMAL_0: /^[-+]?\d*$/,
  DECIMAL_1: /^[-+]?\d*(\.\d)$/,
  DECIMAL_2: /^[-+]?\d*(\.\d){0,2}$/,
  DECIMAL_3: /^[-+]?\d*(\.\d){0,3}$/,
  DECIMAL_4: /^[-+]?\d*(\.\d){0,4}$/,
  DECIMAL_5: /^[-+]?\d*(\.\d){0,5}$/,
  DECIMAL_6: /^[-+]?\d*(\.\d){0,6}$/,
  STRICT_ALPHA: /^[A-Za-z]*$/,
  STRICT_ALPHA_NUMERIC: /^[\dA-Za-z]*$/,
  CODE: /^[\dA-Za-z.]*$/,
  ALPHA: /^[A-Za-z ŠŒŽšœžŸÀ-ÖØ-öø-ÿ]*$/,
  ALPHA_NUMERIC: /^[\dA-Za-z ŠŒŽšœžŸÀ-ÖØ-öø-ÿ]*$/,
  EXTENDED_ALPHA: /^[A-Za-z ŠŒŽšœžŸÀ-ÖØ-öø-ÿ&-),-/:-;]*$/,
  EXTENDED_ALPHA_NUMERIC: /^[\dA-Za-z ŠŒŽšœžŸÀ-ÖØ-öø-ÿ&-),-/:-;]*$/,
  FREE_FORM_TEXT: /^[\s\c\u0020-\u00FF]*$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  UUID4: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  LAT_LONG: /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
  TIME_WEEK: /^\d{4}-[wW](\d|([0-4]\d)|(5[0123]))$/,
  TIME_MONTH: /^\d{4}-(1[0-2]|0[1-9])$/,
  TIME_QUARTER: /^\d{4}-[qQ][1-4]$/,
  TIME_YEAR: /^\d{4}$/,
};

export class ValidationUtil {
  public static validate(patternKey: keyof typeof VALIDATION_PATTERN, value: string | number, isRequired = false): boolean {
    if (value === undefined || value === null || value === '') {
      return !isRequired;
    }
    if (typeof value === 'number') {
      value = value.toString();
    }
    return VALIDATION_PATTERN[patternKey].test(value);
  }
}
