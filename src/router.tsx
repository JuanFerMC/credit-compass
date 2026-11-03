import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { getGlobalStartContext } from "@tanstack/react-start";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Nonce de la CSP de ESTA petición (lo genera el middleware de src/start.ts).
  // TanStack lo estampa en sus scripts inline de hidratación. Solo existe en el
  // servidor: en el cliente el router lo lee de <meta property="csp-nonce">.
  const nonce = getGlobalStartContext()?.nonce;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    ...(nonce ? { ssr: { nonce } } : {}),
  });

  return router;
};
