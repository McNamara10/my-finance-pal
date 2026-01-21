import { Euro } from "lucide-react";

const BalanceWidget = () => {
  return (
    <div className="widget-card animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Euro className="w-4 h-4 text-primary" />
        </div>
        <span className="stat-label">Saldo Attuale</span>
      </div>
      <p className="stat-value">€794,00</p>
      <p className="text-sm text-muted-foreground mt-1">Aggiornato oggi</p>
    </div>
  );
};

export default BalanceWidget;
