import { DepthContext } from './depthContext.js';

/** Wrap a page once: <DepthProvider value="tilt"> … every card inside tilts. */
export function DepthProvider({ value = 'flat', children }) {
  return <DepthContext.Provider value={value}>{children}</DepthContext.Provider>;
}
