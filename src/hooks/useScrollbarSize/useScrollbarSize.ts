import { useMemo } from 'react';

import { WindowManager } from '../../classes/managers/WindowManager';


export const useScrollbarSize = () => {
  const scrollbarSize = useMemo(() => {
    const win = WindowManager.instance.window;
    const div1 = win.document.createElement('div');
    const div2 = win.document.createElement('div');
    div1.style.width = '100px';
    div1.style.overflowX = 'scroll';
    div2.style.width = '100px';
    win.document.body.appendChild(div1);
    win.document.body.appendChild(div2);
    const size = div1.offsetHeight - div2.offsetHeight;
    win.document.body.removeChild(div1);
    win.document.body.removeChild(div2);
    return size;
  }, []);

  return scrollbarSize;
};
