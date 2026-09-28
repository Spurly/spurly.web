import { lazy } from "react";
import { startRouteLoad, endRouteLoad } from "src/app/routeLoadingStore";

/**
 * Drop-in replacement for React.lazy() that reports into
 * routeLoadingStore while the chunk is in flight, so RouteProgressBar can
 * show a delayed top-of-page indicator instead of the page looking frozen
 * on a slow route transition. See routeLoadingStore.js for why this exists.
 *
 * Usage is identical to lazy(): pass the same loader, including ones with
 * a `.then(m => ({ default: m.Named }))` tail for named exports.
 */
export function lazyWithProgress(loader) {
  return lazy(() => {
    startRouteLoad();
    const result = loader();
    result.then(endRouteLoad, endRouteLoad);
    return result;
  });
}
