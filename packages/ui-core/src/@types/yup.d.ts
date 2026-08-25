/* eslint-disable @typescript-eslint/no-unused-vars */
import type { StringSchema } from 'yup';

declare module 'yup' {
  interface StringSchema {
    alpha(): StringSchema;
    alphaNumeric(): StringSchema;
    code(): StringSchema;
    decimal0(): StringSchema;
    decimal1(): StringSchema;
    decimal2(): StringSchema;
    decimal3(): StringSchema;
    decimal4(): StringSchema;
    decimal5(): StringSchema;
    decimal6(): StringSchema;
    email(): StringSchema;
    extendedAlphaNumeric(): StringSchema;
    freeFormText(): StringSchema;
    latLong(): StringSchema;
    regex(): StringSchema;
    strictAlpha(): StringSchema;
    strictAlphaNumeric(): StringSchema;
    timeMonth(): StringSchema;
    timeQuarter(): StringSchema;
    timeWeek(): StringSchema;
    timeYear(): StringSchema;
    url(): StringSchema;
    uuid4(): StringSchema;
  }
}
