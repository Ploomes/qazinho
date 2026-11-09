export const NOTCH_SCRIPT = `ObjC.import('AppKit');
const primary = $.NSScreen.screens.objectAtIndex(0);
JSON.stringify({
  top: primary.safeAreaInsets.top,
  width:
    primary.frame.size.width -
    primary.auxiliaryTopLeftArea.size.width -
    primary.auxiliaryTopRightArea.size.width,
});`;
