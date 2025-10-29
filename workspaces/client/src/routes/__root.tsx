import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { type authService, useAuth } from "@/hooks/useAuth";

export const Route = createRootRouteWithContext<{
  auth: typeof authService;
  queryClient: QueryClient;
}>()({
  head: () => ({ meta: [{ title: "kakiage" }] }),
  component: () => {
    const { isLoading } = useAuth();

    const isEditor = useLocation({
      select: location => /\/writeups\/\d+\/edit/.test(location.pathname),
    });

    if (isLoading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
      <>
        <HeadContent />
        <div className={`flex flex-col ${isEditor ? "overflow-hidden h-dvh" : "min-h-screen"}`}>
          <Header />
          <main className="flex-1 min-h-0 flex flex-col items-center py-2">
            <Outlet />
          </main>
          <Footer />
          <TanStackRouterDevtools />
        </div>
      </>
    );
  },
});
