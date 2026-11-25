import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { AtlasPage } from "./atlas-page.js";
import { parseDevSearch } from "./dev-switches.js";

const rootRoute = createRootRoute({ component: Outlet });

const atlasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: parseDevSearch,
  component: AtlasPage,
});

export const router = createRouter({ routeTree: rootRoute.addChildren([atlasRoute]) });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { atlasRoute };
