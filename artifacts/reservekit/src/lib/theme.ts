import { useEffect, useState } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('reservekit-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('reservekit-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark] as const;
}
