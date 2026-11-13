export const hasOpenDialogPopper = (dialogContent: HTMLElement | null | undefined): boolean => {
  if (!dialogContent) {
    return false;
  }

  const expandedElements = dialogContent.querySelectorAll<HTMLElement>('[aria-expanded="true"][aria-controls]');
  return Array.from(expandedElements).some((expandedElement) => {
    const controlledElementIds = expandedElement.getAttribute('aria-controls')?.trim().split(/\s+/) ?? [];
    return controlledElementIds.some((controlledElementId) => {
      const controlledElement = expandedElement.ownerDocument.getElementById(controlledElementId);
      return Boolean(controlledElement?.closest('.MuiPopper-root'));
    });
  });
};

export const createDialogPopperClickGuard = () => {
  let pointerDownHadOpenPopper = false;
  const clickEventsWithOpenPopper = new WeakSet<object>();

  return {
    onClickCapture: (clickEvent: object, clickDetail: number, dialogContent: HTMLElement | null | undefined): void => {
      if (hasOpenDialogPopper(dialogContent) || (clickDetail > 0 && pointerDownHadOpenPopper)) {
        clickEventsWithOpenPopper.add(clickEvent);
      }
      pointerDownHadOpenPopper = false;
    },
    onPointerCancelCapture: (): void => {
      pointerDownHadOpenPopper = false;
    },
    onPointerDownCapture: (dialogContent: HTMLElement | null | undefined): void => {
      pointerDownHadOpenPopper = hasOpenDialogPopper(dialogContent);
    },
    shouldIgnoreBackdropClick: (clickEvent: unknown): boolean => (
      typeof clickEvent === 'object'
      && clickEvent !== null
      && clickEventsWithOpenPopper.delete(clickEvent)
    ),
  };
};
