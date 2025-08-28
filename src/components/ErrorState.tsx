import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Erro ao carregar dados",
  description = "Ocorreu um erro inesperado. Tente novamente.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <Card className={cn("financial-card border-destructive/20", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 text-destructive">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {description}
        </p>
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}