import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@remcostoeten/analytics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import PackagePage from "./pages/PackagePage";
import NotFound from "./pages/NotFound";
import { DOCS_MODE, PRIMARY_PACKAGE_SLUG } from "./config/site";
import {
  analyticsEnabled,
  analyticsIngestUrl,
  analyticsProjectId,
} from "./lib/analytics";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Analytics
          projectId={analyticsProjectId}
          ingestUrl={analyticsIngestUrl}
          disabled={!analyticsEnabled}
          debug={import.meta.env.DEV}
        />
        <BrowserRouter>
          <Routes>
            {DOCS_MODE === "package" ? (
              <>
                <Route path="/" element={<PackagePage forcedSlug={PRIMARY_PACKAGE_SLUG} />} />
                <Route path={`/${PRIMARY_PACKAGE_SLUG}`} element={<Navigate to="/" replace />} />
                <Route path="/:slug" element={<NotFound />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Index />} />
                <Route path="/:slug" element={<PackagePage />} />
              </>
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
