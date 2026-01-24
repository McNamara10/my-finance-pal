import { Euro } from "lucide-react";

type BalanceWidgetProps = {
  balance: number;
  updatedLabel?: string;
};

const formatEuro = (value: number) => {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? "-" : ""}€${formatted}`;
};

const BalanceWidget = ({ balance, updatedLabel = "Aggiornato oggi" }: BalanceWidgetProps) => {
  return (
    <div className="widget-card animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Euro className="w-4 h-4 text-primary" />
        </div>
        <span className="stat-label">Saldo Attuale</span>
      </div>
      <p className="stat-value">{formatEuro(balance)}</p>
      <p className="text-sm text-muted-foreground mt-1">{updatedLabel}</p>
    </div>
  );
};

export default BalanceWidget;
