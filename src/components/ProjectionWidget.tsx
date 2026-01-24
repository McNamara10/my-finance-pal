import { TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";

type ProjectionWidgetProps = {
  projectionDateLabel: string;
  projectedBalance: number;
  delta: number;
  deltaPct: number;
};

const formatEuro = (value: number) => {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? "-" : ""}€${formatted}`;
};

const ProjectionWidget = ({ projectionDateLabel, projectedBalance, delta, deltaPct }: ProjectionWidgetProps) => {
  const isPositive = delta >= 0;
  const deltaLabel = `${isPositive ? "+" : "-"}${formatEuro(Math.abs(delta))} (${Math.abs(deltaPct).toFixed(1)}%)`;

  return (
    <div className="widget-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-success" />
        </div>
        <span className="stat-label">Proiezione ({projectionDateLabel})</span>
      </div>
      <p className="stat-value">{formatEuro(projectedBalance)}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-success" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-destructive" />
        )}
        <span className={isPositive ? "positive-change text-sm" : "text-sm font-semibold text-destructive"}>
          {deltaLabel}
        </span>
      </div>
    </div>
  );
};

export default ProjectionWidget;
