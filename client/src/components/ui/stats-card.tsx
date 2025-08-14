import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendLabel?: string;
  color: "primary" | "secondary" | "accent" | "success" | "warning";
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color,
  ...props
}: StatsCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <Card className="border border-gray-200 shadow-sm" {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
        {(trend || trendLabel) && (
          <div className="mt-4 flex items-center">
            {trend && (
              <span className="text-success text-sm font-medium">{trend}</span>
            )}
            {trendLabel && (
              <span className={`text-gray-500 text-sm ${trend ? "ml-2" : ""}`}>
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
