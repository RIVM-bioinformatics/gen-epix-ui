import { AuthenticationManager } from '../../classes/managers/AuthenticationManager';

export class CommonDownloadUtil {
  public static arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  public static createDownloadUrl(url: string, name: string): void {
    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public static downloadAsMultiPartForm(kwArgs: { action: string; data: Record<string, string | string[]> }): void {
    const formElement = document.createElement('form');
    formElement.method = 'POST';
    formElement.action = kwArgs.action;
    formElement.style.display = 'none';
    formElement.target = '_blank';

    Object.entries(kwArgs.data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          const input = document.createElement('input');
          input.name = key;
          input.value = v;
          formElement.appendChild(input);
        });
        return;
      }

      const input = document.createElement('input');
      input.name = key;
      input.value = value;
      formElement.appendChild(input);
    });
    const input = document.createElement('input');
    input.name = 'token';
    // ! FIXME: add access token to arguments instead of accessing it directly here
    input.value = AuthenticationManager.getInstance().authContextProps?.user?.access_token ?? '';
    formElement.appendChild(input);

    document.body.appendChild(formElement);
    formElement.submit();
    document.body.removeChild(formElement);
  }
}
