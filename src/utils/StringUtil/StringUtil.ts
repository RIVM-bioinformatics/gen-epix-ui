import { v4 } from 'uuid';

export class StringUtil {
  public static clean(value: string): string {
    if (!value) {
      return value;
    }
    return value.replace(/[^\dA-zÀ-ú]/g, '');
  }

  public static toString(value: string | number): string {
    if (typeof value === 'number') {
      return value.toString();
    }
    return value ?? '';
  }

  public static createUuid(): string {
    return v4();
  }

  public static createHash(str: string, seed = 0): string {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return String(4294967296 * (2097151 & h2) + (h1 >>> 0));
  }

  public static sortComperator(a: string, b: string): number {
    return a.localeCompare(b);
  }

  public static advancedSortComperator(a: string, b: string): number {
    const regex = /\d+|\D+/g;
    const aParts = a.match(regex);
    const bParts = b.match(regex);

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      const aValue = aParts[i];
      const bValue = bParts[i];

      if (aValue === bValue) {
        continue;
      }
      const isAFinite = isFinite(+aValue);
      const isBFinite = isFinite(+bValue);
      if (isAFinite && isBFinite) {
        return +aValue - +bValue;
      }
      if (isAFinite) {
        return -1;
      }
      if (isBFinite) {
        return 1;
      }
      return aValue.localeCompare(bValue);
    }
    return aParts.length > bParts.length ? 1 : -1;

  }

  public static createSlug(input: string): string {
    return input
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }
}
