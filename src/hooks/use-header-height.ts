import { createContext, useContext } from 'react';

/* the height of the shared header in AppTabs - native tabs fill the whole screen, so each screen pads by it */
export const HeaderHeightContext = createContext(0);

export const useHeaderHeight = () => useContext(HeaderHeightContext);
