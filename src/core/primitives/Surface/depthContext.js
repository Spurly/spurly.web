import { createContext } from 'react';

/**
 * Page-level default for Surface's `depth` prop. `undefined` means "no page
 * opinion", which Surface reads as 'flat'. A Surface's own `depth` prop always
 * wins over this, so a page can opt in wholesale and still flatten one card.
 */
export const DepthContext = createContext(undefined);
