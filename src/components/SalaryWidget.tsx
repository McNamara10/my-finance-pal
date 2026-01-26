import { Calendar, TrendingUp } from "lucide-react";

type SalaryWidgetProps = {
  dateLabel: string;
  projectedBalance: number;
  salaryAmount: number;
  hasData: boolean;
};

const formatEuro = (value: number) => {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? "-" : ""}€${formatted}`;
};

const SalaryWidget = ({ dateLabel, projectedBalance, salaryAmount, hasData }: SalaryWidgetProps) => {
  if (!hasData) {
    return (
      <div className="widget-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="stat-label">Proiezione Stipendio</span>
        </div>
        <p className="stat-value text-muted-foreground">—</p>
        <p className="text-xs text-muted-foreground mt-1">
          Nessuna entrata ricorrente configurata
        </p>
      </div>
    );
  }

  const isNegative = projectedBalance < 0;

  return (
    <div className="widget-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <span className="stat-label">Proiezione al {dateLabel}</span>
      </div>
      <p className={`stat-value ${isNegative ? "text-destructive" : ""}`}>
        {formatEuro(projectedBalance)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Prima dell'arrivo dello stipendio di {formatEuro(salaryAmount)}
      </p>
    </div>
  );
};

export default SalaryWidget;
