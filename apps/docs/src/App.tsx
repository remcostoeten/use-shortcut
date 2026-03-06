import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@remcostoeten/analytics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import PackagePage from "./pages/PackagePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const analyticsIngestUrl = import.meta.env.VITE_REMCO_ANALYTICS_URL as
  | string
  | undefined;

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Analytics
          projectId="use-shortcut-docs"
          ingestUrl={analyticsIngestUrl}
          disabled={!analyticsIngestUrl}
          debug={import.meta.env.DEV}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/use-shortcut" element={<PackagePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
