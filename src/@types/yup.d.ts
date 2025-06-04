/* eslint-disable @typescript-eslint/no-unused-vars */
import type { StringSchema } from 'yup';

declare module 'yup' {
  interface StringSchema {
    code(): StringSchema;
    strictAlpha(): StringSchema;
    strictAlphaNumeric(): StringSchema;
    alpha(): StringSchema;
    alphaNumeric(): StringSchema;
    extendedAlpha(): StringSchema;
    extendedAlphaNumeric(): StringSchema;
    freeFormText(): StringSchema;
    email(): StringSchema;
    uuid4(): StringSchema;
    latLong(): StringSchema;
    timeWeek(): StringSchema;
    timeQuarter(): StringSchema;
    timeMonth(): StringSchema;
    timeYear(): StringSchema;
    decimal0(): StringSchema;
    decimal1(): StringSchema;
    decimal2(): StringSchema;
    decimal3(): StringSchema;
    decimal4(): StringSchema;
    decimal5(): StringSchema;
    decimal6(): StringSchema;
  }
}
