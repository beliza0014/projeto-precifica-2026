import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FinancialProvider } from "@/contexts/FinancialContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LoadingOptimizer } from "@/components/LoadingOptimizer";
import { Menu, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load heavy components for better performance
import { 
  LazyIndicadores, 
  LazyReceitas, 
  LazyVariacoes,
  LazyFaturamento,
  LazyInsumos,
  LazyVendas,
  LazyPrecificacao,
  LazyPromocoes,
  preloadIndicadores,
  preloadReceitas,
  preloadVariacoes
} from "@/utils/lazyComponents";

// Keep lighter components as regular imports
import Dashboard from "./pages/Dashboard";
import CustosFixos from "./pages/CustosFixos";
import TaxasImpostos from "./pages/TaxasImpostos";
import Markup from "./pages/Markup";
import Delivery from "./pages/Delivery";
import PlanoIfood from "./pages/PlanoIfood";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import ResetSistema from "./pages/ResetSistema";
import { TooltipDemo } from "./components/TooltipDemo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimize query defaults for better performance
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Preload critical components after initial render
React.startTransition(() => {
  // Preload most commonly used pages
  preloadIndicadores();
  preloadReceitas();
  preloadVariacoes();
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FinancialProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <SidebarProvider defaultOpen={true}>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            
            {/* Header with mobile trigger */}
            <div className="flex-1 flex flex-col">
              <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                <SidebarTrigger className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </SidebarTrigger>
                
                <div className="flex items-center gap-2 md:hidden">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h1 className="font-bold text-lg text-foreground">FinanceApp</h1>
                </div>
                
                <div className="ml-auto flex items-center gap-2">
                  {/* Future: user menu, notifications, etc. */}
                </div>
              </header>
              
              <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/indicadores" element={<LazyIndicadores />} />
                    <Route path="/vendas" element={<LazyVendas />} />
                    <Route path="/custos-fixos" element={<CustosFixos />} />
                     
                     <Route path="/taxas-impostos" element={<TaxasImpostos />} />
                      <Route path="/faturamento" element={<LazyFaturamento />} />
                     <Route path="/markup" element={<Markup />} />
                     <Route path="/insumos" element={<LazyInsumos />} />
                     <Route path="/receitas" element={<LazyReceitas />} />
                     <Route path="/variacoes" element={<LazyVariacoes />} />
                     <Route path="/precificacao" element={<LazyPrecificacao />} />
                    <Route path="/delivery" element={<Delivery />} />
                    <Route path="/plano-ifood" element={<PlanoIfood />} />
                    <Route path="/promocoes" element={<LazyPromocoes />} />
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/resetar-sistema" element={<ResetSistema />} />
                    <Route path="/tooltip-demo" element={<TooltipDemo />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
    </FinancialProvider>
  </QueryClientProvider>
);

export default App;
