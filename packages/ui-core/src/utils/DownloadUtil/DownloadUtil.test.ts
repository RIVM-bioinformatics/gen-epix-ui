import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { DownloadUtil } from './DownloadUtil';

describe('DownloadUtil', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('arrayBufferToBase64', () => {
    it('encodes empty and binary buffers as base64', () => {
      expect(DownloadUtil.arrayBufferToBase64(new ArrayBuffer(0))).toBe('');
      expect(DownloadUtil.arrayBufferToBase64(new Uint8Array([0, 255, 1]).buffer)).toBe('AP8B');
    });
  });

  describe('createDownloadUrl', () => {
    it('clicks a temporary link with the requested URL and filename', () => {
      const appendChild = vi.spyOn(document.body, 'appendChild');
      const removeChild = vi.spyOn(document.body, 'removeChild');
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

      DownloadUtil.createDownloadUrl('https://example.test/file', 'data.csv');

      const link = appendChild.mock.calls[0][0] as HTMLAnchorElement;
      expect(link.href).toBe('https://example.test/file');
      expect(link.download).toBe('data.csv');
      expect(click).toHaveBeenCalledOnce();
      expect(removeChild).toHaveBeenCalledWith(link);
      expect(document.body.contains(link)).toBe(false);
    });
  });

  describe('downloadAsMultiPartForm', () => {
    it('submits scalar and repeated values with the access token', () => {
      const appendChild = vi.spyOn(document.body, 'appendChild');
      const removeChild = vi.spyOn(document.body, 'removeChild');
      const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);

      DownloadUtil.downloadAsMultiPartForm({
        accessToken: 'access-token',
        action: 'https://example.test/download',
        data: {
          case_id: 'case-1',
          case_ids: ['case-2', 'case-3'],
          empty: [],
        },
      });

      const form = appendChild.mock.calls[0][0] as HTMLFormElement;
      expect(form.method).toBe('post');
      expect(form.action).toBe('https://example.test/download');
      expect(form.target).toBe('_blank');
      expect(form.style.display).toBe('none');
      expect(Array.from(form.elements).map((input) => [input.getAttribute('name'), (input as HTMLInputElement).value])).toEqual([
        ['case_id', 'case-1'],
        ['case_ids', 'case-2'],
        ['case_ids', 'case-3'],
        ['token', 'access-token'],
      ]);
      expect(submit).toHaveBeenCalledOnce();
      expect(removeChild).toHaveBeenCalledWith(form);
      expect(document.body.contains(form)).toBe(false);
    });
  });

  describe('fetchAsDataUrl', () => {
    it('posts repeated form values and returns the response blob as a data URL', async () => {
      const blob = new Blob([new Uint8Array([65, 66])], { type: 'text/plain' });
      const fetchMock = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
        expect(init?.method).toBe('POST');
        if (!(init?.body instanceof URLSearchParams)) {
          throw new Error('Expected URL-encoded form data');
        }
        expect(init.body.getAll('case_id')).toEqual(['one', 'two']);
        expect(init.body.get('name')).toBe('dataset');
        expect(init.body.get('token')).toBe('access-token');
        return {
          blob: async () => Promise.resolve(blob),
          ok: true,
        };
      });
      vi.stubGlobal('fetch', fetchMock);

      await expect(DownloadUtil.fetchAsDataUrl({
        accessToken: 'access-token',
        action: 'https://example.test/export',
        data: {
          case_id: ['one', 'two'],
          name: 'dataset',
        },
      })).resolves.toBe('data:text/plain;base64,QUI=');

      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('uses the default media type for an empty blob type', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        blob: async () => Promise.resolve(new Blob([new Uint8Array([65])], { type: '' })),
        ok: true,
      }));

      await expect(DownloadUtil.fetchAsDataUrl({
        accessToken: '',
        action: '/export',
        data: {},
      })).resolves.toBe('data:application/octet-stream;base64,QQ==');
    });

    it('throws when the response is not successful', async () => {
      const blob = vi.fn();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        blob,
        ok: false,
        status: 403,
      }));

      await expect(DownloadUtil.fetchAsDataUrl({
        accessToken: 'token',
        action: '/forbidden',
        data: {},
      })).rejects.toThrow('Request to /forbidden failed with status 403');
      expect(blob).not.toHaveBeenCalled();
    });
  });
});
