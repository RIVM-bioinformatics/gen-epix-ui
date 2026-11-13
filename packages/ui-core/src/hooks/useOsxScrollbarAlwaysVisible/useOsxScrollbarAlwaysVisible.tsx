import { useLayoutEffect } from 'react';

export const useOsxScrollbarAlwaysVisible = (nonce?: string) => {
  useLayoutEffect(() => {
    const css = `
      [data-scrollbar-setting="overlay"] ::-webkit-scrollbar {
        -webkit-appearance: none !important;
        width: 14px !important;
        height: 14px !important;
      }

      [data-scrollbar-setting="overlay"] ::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
      }

      [data-scrollbar-setting="overlay"] ::-webkit-scrollbar-thumb {
        background-color: #c1c1c1 !important;
        border: 3px solid #f1f1f1 !important;
        border-radius: 6px !important;
      }
    `;
    const style = document.createElement('style');
    if (nonce) {
      style.nonce = nonce;
    }
    style.textContent = css;
    document.head.appendChild(style);
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.width = '50px';
    outer.style.position = 'absolute';
    document.body.appendChild(outer);

    const isAlwaysVisible = (outer.offsetWidth - outer.clientWidth) > 0;
    document.body.removeChild(outer);

    const detectedSetting = isAlwaysVisible ? 'always' : 'overlay';
    document.documentElement.setAttribute('data-scrollbar-setting', detectedSetting);
    return () => {
      style.remove();
    };
  }, [nonce]);
};
