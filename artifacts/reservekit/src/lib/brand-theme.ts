import { useEffect } from 'react';
import { useGetBusiness } from '@workspace/api-client-react';

/** Converts a `#rrggbb` hex color to `"H S% L%"` (the format used by the CSS custom properties in `index.css`). */
function hexToHslTriplet(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const value = parseInt(match[1], 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Applies the business's configured primary/secondary brand colors (set on
 * the Settings page, see PROJECT.md "BUSINESS SETTINGS" and "WHITE LABEL
 * TEMPLATE") to the app's CSS custom properties at runtime, so white-label
 * rebranding takes effect without a rebuild.
 */
export function useBrandTheme(): void {
  const { data: business } = useGetBusiness();

  useEffect(() => {
    const root = document.documentElement;
    const primary = business?.primaryColor ? hexToHslTriplet(business.primaryColor) : null;
    const secondary = business?.secondaryColor ? hexToHslTriplet(business.secondaryColor) : null;

    if (primary) {
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--ring', primary);
      root.style.setProperty('--sidebar-primary', primary);
      root.style.setProperty('--sidebar-ring', primary);
    }
    if (secondary) {
      root.style.setProperty('--secondary', secondary);
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--secondary');
    };
  }, [business?.primaryColor, business?.secondaryColor]);
}
