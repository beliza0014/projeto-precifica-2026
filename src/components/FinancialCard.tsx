import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "destructive" | "warning";
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

export function FinancialCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  loading = false,
  className,
  children
}: FinancialCardProps) {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-gradient-to-br from-success/5 to-success/10";
      case "destructive":
        return "border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10";
      case "warning":
        return "border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10";
      default:
        return "financial-card-elevated";
    }
  };

  const getValueStyles = (variant: string) => {
    switch (variant) {
      case "success":
        return "metric-positive";
      case "destructive":
        return "metric-negative";
      case "warning":
        return "text-warning font-semibold";
      default:
        return "metric-neutral";
    }
  };

  if (loading) {
    return (
      <Card className={cn("financial-card", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(getVariantStyles(variant), "hover:scale-[1.02] transition-transform duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {value !== undefined ? (
          <>
            <div className={cn("text-2xl font-bold", getValueStyles(variant))}>
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}