/**
 * Contador compartilhado: o CartSheet aparece duas vezes no header (mobile + desktop),
 * mas só uma instância deve aplicar/remover o lock no body.
 */
let depth = 0;
let savedScrollY = 0;
let prevHtmlOverflow = '';
type BodyLockKeys = 'position' | 'top' | 'left' | 'right' | 'width' | 'overflow';
const bodyKeys: BodyLockKeys[] = ['position', 'top', 'left', 'right', 'width', 'overflow'];
let prevBody: Record<BodyLockKeys, string> = {
  position: '',
  top: '',
  left: '',
  right: '',
  width: '',
  overflow: '',
};

export function acquireCartBodyScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (depth === 0) {
    savedScrollY = window.scrollY;
    const html = document.documentElement;
    prevHtmlOverflow = html.style.overflow;
    for (const k of bodyKeys) {
      prevBody[k] = document.body.style[k];
    }
    html.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }
  depth += 1;
}

export function releaseCartBodyScrollLock(): void {
  if (typeof document === 'undefined') return;
  depth = Math.max(0, depth - 1);
  if (depth > 0) return;

  const html = document.documentElement;
  html.style.overflow = prevHtmlOverflow;
  for (const k of bodyKeys) {
    document.body.style[k] = prevBody[k];
  }
  window.scrollTo(0, savedScrollY);
}
