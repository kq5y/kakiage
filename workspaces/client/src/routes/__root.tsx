import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { type authService, useAuth } from "@/hooks/useAuth";

export const Route = createRootRouteWithContext<{
  auth: typeof authService;
  queryClient: QueryClient;
}>()({
  component: () => {
    const { isLoading } = useAuth();

    if (isLoading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Outlet />
        </main>
        <Footer />
        <TanStackRouterDevtools />
      </div>
    );
  },
});
