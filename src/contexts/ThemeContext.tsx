import { createContext, useContext } from 'react';
import { CLASSIC, type Theme } from '../utils/themes';

/**
 * Theme context — provides the active theme to every component.
 * Default is CLASSIC so consumers always have something to read.
 */
export const ThemeContext = createContext<Theme>(CLASSIC);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
