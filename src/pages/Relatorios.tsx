import { FileText, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFinancial } from "@/contexts/FinancialContext";
import { toast } from "@/hooks/use-toast";
import { 
  buildFixedCostsReport, 
  buildVariableCostsReport, 
  buildInsumosReport, 
  buildReceitasReport, 
  buildVariacoesReport, 
  buildFaturamentoReport, 
  buildIndicadoresReport, 
  buildDeliveryReport, 
  buildAllReports 
} from "@/utils/reportBuilders";
import { exportToXlsx, exportToPdf, exportAllReports } from "@/utils/exportUtils";

export default function Relatorios() {
  const context = useFinancial();
  
  const relatorios = [
    { 
      nome: "Custos Fixos", 
      descricao: "Relatório mensal de custos fixos",
      builder: () => buildFixedCostsReport(context)
    },
    { 
      nome: "Custos Variáveis", 
      descricao: "Análise de custos variáveis por canal",
      builder: () => buildVariableCostsReport(context)
    },
    { 
      nome: "Insumos", 
      descricao: "Controle de matéria-prima e custos",
      builder: () => buildInsumosReport(context)
    },
    { 
      nome: "Receitas", 
      descricao: "Fichas técnicas dos produtos",
      builder: () => buildReceitasReport(context)
    },
    { 
      nome: "Variações", 
      descricao: "Produtos vendidos e margens",
      builder: () => buildVariacoesReport(context)
    },
    { 
      nome: "Faturamento", 
      descricao: "Vendas e análise de receitas",
      builder: () => buildFaturamentoReport(context)
    },
    { 
      nome: "Indicadores", 
      descricao: "CMV e rankings de produtos",
      builder: () => buildIndicadoresReport(context)
    },
    { 
      nome: "Delivery", 
      descricao: "Configurações de entrega e taxas",
      builder: () => buildDeliveryReport(context)
    }
  ];

  const exportarRelatorio = (tipo: string, formato: 'xlsx' | 'pdf') => {
    try {
      const relatorio = relatorios.find(r => r.nome === tipo);
      if (!relatorio) {
        toast({
          title: "❌ Erro",
          description: "Tipo de relatório não encontrado.",
          variant: "destructive"
        });
        return;
      }

      const sheets = relatorio.builder();
      const sheetsArray = Array.isArray(sheets) ? sheets : [sheets];
      
      if (formato === 'xlsx') {
        exportToXlsx(`Relatorio_${tipo.replace(/\s+/g, '_')}`, sheetsArray);
      } else {
        exportToPdf(`Relatorio_${tipo.replace(/\s+/g, '_')}`, sheetsArray);
      }

      toast({
        title: "✅ Exportação concluída!",
        description: `Relatório "${tipo}" exportado em ${formato.toUpperCase()}.`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "❌ Erro na exportação",
        description: error instanceof Error ? error.message : "Falha ao exportar relatório.",
        variant: "destructive"
      });
    }
  };

  const exportarTudo = () => {
    try {
      const allSheets = buildAllReports(context);
      exportAllReports(allSheets);
      
      toast({
        title: "✅ Exportação completa!",
        description: "Todos os relatórios foram exportados em um único arquivo XLSX."
      });
    } catch (error) {
      console.error('Export all error:', error);
      toast({
        title: "❌ Erro na exportação",
        description: error instanceof Error ? error.message : "Falha ao exportar relatórios.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Exporte relatórios consolidados em XLSX e PDF
          </p>
        </div>
        
        <Button 
          onClick={exportarTudo}
          className="gap-2"
          size="lg"
        >
          <Download className="h-4 w-4" />
          Exportar Tudo (XLSX)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatorios.map((relatorio) => (
          <Card key={relatorio.nome} className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {relatorio.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {relatorio.descricao}
              </p>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                    Exportar
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem 
                    onClick={() => exportarRelatorio(relatorio.nome, 'xlsx')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar XLSX
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => exportarRelatorio(relatorio.nome, 'pdf')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}