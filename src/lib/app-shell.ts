const DESKTOP_BREAKPOINT = 768;

export const APP_SHELL_DESKTOP_SIDEBAR_WIDTH = 64;
export const APP_SHELL_MOBILE_NAV_HEIGHT = 56;

function parseCssPixelValue(value: string) {
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getAppShellViewportInsets() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      left: 0,
      bottom: APP_SHELL_MOBILE_NAV_HEIGHT,
    };
  }

  const isDesktop = window.matchMedia(
    `(min-width: ${DESKTOP_BREAKPOINT}px)`
  ).matches;
  const fallbackLeft = isDesktop ? APP_SHELL_DESKTOP_SIDEBAR_WIDTH : 0;
  const fallbackBottom = isDesktop ? 0 : APP_SHELL_MOBILE_NAV_HEIGHT;
  const styles = getComputedStyle(document.documentElement);
  const left =
    parseCssPixelValue(styles.getPropertyValue('--app-sidebar-width')) ||
    fallbackLeft;
  const bottom =
    parseCssPixelValue(styles.getPropertyValue('--app-mobile-nav-height')) ||
    fallbackBottom;

  return { left, bottom };
}
