export class TestIdUtil {
  public static createAttributes(name: string, props: Record<string, string | number> = {}): Record<string, string> {
    const attribute: Record<string, string> = {
      'data-testid': name,
    };

    Object.keys(props).forEach((key) => {
      attribute[`data-testid-prop-${key}`] = `${props[key]}`;
    });

    return attribute;
  }
}
