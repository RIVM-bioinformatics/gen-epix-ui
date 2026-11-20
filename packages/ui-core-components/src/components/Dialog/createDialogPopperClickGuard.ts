export const hasOpenDialogPopper = (dialogContent: HTMLElement | null | undefined): boolean => {
  if (!dialogContent) {
    return false;
  }

  const document = dialogContent.ownerDocument;
  const expandedElements = dialogContent.querySelectorAll<HTMLElement>('[aria-expanded="true"][aria-controls]');
  const hasExpandedPopper = Array.from(expandedElements).some((expandedElement) => {
    const controlledElementIds = expandedElement.getAttribute('aria-controls').trim().split(/\s+/);
    return controlledElementIds.some((controlledElementId) => {
      const controlledElement = document.getElementById(controlledElementId);
      return Boolean(controlledElement?.closest('.MuiPopper-root'));
    });
  });
  if (hasExpandedPopper) {
    return true;
  }

  const focusedCombobox = dialogContent.querySelector<HTMLElement>('[role="combobox"]:focus');
  return Boolean(focusedCombobox && document.querySelector('.MuiAutocomplete-popper'));
};

export const createDialogPopperClickGuard = () => {
  let pointerDownHadOpenPopper = false;
  let clickHadOpenPopper = false;
  const clickEventsWithOpenPopper = new WeakSet<object>();

  return {
    onClickCapture: (clickEvent: object, clickDetail: number, dialogContent: HTMLElement | null | undefined): void => {
      clickHadOpenPopper = hasOpenDialogPopper(dialogContent) || (clickDetail > 0 && pointerDownHadOpenPopper);
      if (clickHadOpenPopper) {
        clickEventsWithOpenPopper.add(clickEvent);
      }
      pointerDownHadOpenPopper = false;
    },
    onPointerCancelCapture: (): void => {
      pointerDownHadOpenPopper = false;
      clickHadOpenPopper = false;
    },
    onPointerDownCapture: (dialogContent: HTMLElement | null | undefined): void => {
      clickHadOpenPopper = false;
      pointerDownHadOpenPopper = hasOpenDialogPopper(dialogContent);
    },
    shouldIgnoreBackdropClick: (clickEvent: unknown): boolean => {
      const hasMatchingClickEvent = typeof clickEvent === 'object'
        && clickEvent !== null
        && clickEventsWithOpenPopper.delete(clickEvent);
      const shouldIgnore = hasMatchingClickEvent || clickHadOpenPopper;
      clickHadOpenPopper = false;
      return shouldIgnore;
    },
  };
};
