import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Package, 
  ChefHat, 
  Calculator, 
  Truck, 
  ShoppingCart, 
  Tag, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Target,
  RotateCcw
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// Organização lógica por fluxo de trabalho
const navigationSections = [
  {
    label: "Visão Geral",
    items: [
      { 
        title: "Dashboard", 
        url: "/", 
        icon: BarChart3,
        description: "Visão geral dos indicadores"
      },
      { 
        title: "Indicadores", 
        url: "/indicadores", 
        icon: Target,
        description: "Métricas globais de performance"
      },
    ]
  },
  {
    label: "Dados Base",
    items: [
      { 
        title: "Insumos", 
        url: "/insumos", 
        icon: Package,
        description: "Controle de matéria-prima"
      },
      { 
        title: "Receitas", 
        url: "/receitas", 
        icon: ChefHat,
        description: "Fichas técnicas dos produtos"
      },
      { 
        title: "Variações", 
        url: "/variacoes", 
        icon: Package,
        description: "Variações e porções de venda"
      },
      { 
        title: "Custos Fixos", 
        url: "/custos-fixos", 
        icon: DollarSign,
        description: "Gestão de custos fixos mensais" 
      },
    ]
  },
  {
    label: "Vendas & Faturamento",
    items: [
      { 
        title: "Vendas", 
        url: "/vendas", 
        icon: ShoppingCart,
        description: "Registro e importação de vendas"
      },
      { 
        title: "Faturamento", 
        url: "/faturamento", 
        icon: Banknote,
        description: "Controle e cálculo de faturamento"
      },
    ]
  },
  {
    label: "Precificação",
    items: [
      { 
        title: "Taxas e Impostos", 
        url: "/taxas-impostos", 
        icon: TrendingUp,
        description: "Cálculo de taxas e impostos"
      },
      { 
        title: "Precificação",
        url: "/precificacao", 
        icon: Calculator,
        description: "Cálculo de preços e margens"
      },
      { 
        title: "Markup", 
        url: "/markup", 
        icon: TrendingUp,
        description: "Cálculo de markup ideal"
      },
    ]
  },
  {
    label: "Canais & Promoções",
    items: [
      { 
        title: "Delivery", 
        url: "/delivery", 
        icon: Truck,
        description: "Custos de entrega"
      },
      { 
        title: "Plano iFood", 
        url: "/plano-ifood", 
        icon: ShoppingCart,
        description: "Configuração de taxas"
      },
      { 
        title: "Promoções", 
        url: "/promocoes", 
        icon: Tag,
        description: "Simulador de ofertas"
      },
    ]
  },
  {
    label: "Análises",
    items: [
      { 
        title: "Relatórios", 
        url: "/relatorios", 
        icon: FileText,
        description: "Exportações e análises"
      },
    ]
  },
  {
    label: "Sistema",
    items: [
      { 
        title: "Resetar Sistema", 
        url: "/resetar-sistema", 
        icon: RotateCcw,
        description: "Limpar todos os dados"
      },
    ]
  }
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
      <Sidebar 
        className={cn(
          "border-r border-sidebar-border transition-all duration-300 ease-smooth",
          collapsed ? "w-[72px]" : "w-[280px]"
        )}
        collapsible="icon"
      >
        {/* Header with toggle button - only show on desktop */}
        {!isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            {!collapsed && (
              <div className="flex items-center space-x-2 animate-fade-in">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="font-bold text-lg text-sidebar-foreground">FinanceApp</h1>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
        
        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center justify-center p-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-bold text-lg text-sidebar-foreground">FinanceApp</h1>
            </div>
          </div>
        )}

        <SidebarContent className="py-2 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-sidebar-border hover:scrollbar-thumb-sidebar-accent">
          {navigationSections.map((section) => (
            <SidebarGroup key={section.label} className={cn("mb-2", collapsed && "mb-1")}>
              <SidebarGroupLabel className={cn(
                "text-sidebar-foreground/80 text-xs font-semibold uppercase tracking-wider px-4 py-2 mb-2",
                collapsed && "hidden"
              )}>
                {section.label}
              </SidebarGroupLabel>
              
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {section.items.map((item) => {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild
                          tooltip={collapsed ? `${item.title} - ${item.description}` : undefined}
                        >
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className="flex items-center gap-3 w-full"
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
  );
}