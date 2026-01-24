import { ShoppingCart, Coffee, Wifi, Car, CreditCard, ArrowDownLeft, ArrowUpRight, Zap, Home, Heart, Gamepad2, GraduationCap, Plane, Gift, MoreHorizontal } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { it } from "date-fns/locale";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shoppingcart: ShoppingCart,
  coffee: Coffee,
  wifi: Wifi,
  car: Car,
  creditcard: CreditCard,
  zap: Zap,
  home: Home,
  heart: Heart,
  gamepad2: Gamepad2,
  graduationcap: GraduationCap,
  plane: Plane,
  gift: Gift,
};

const formatTransactionDate = (dateString: string) => {
  const date = parseISO(dateString);
  if (isToday(date)) return "Oggi";
  if (isYesterday(date)) return "Ieri";
  return format(date, "d MMM", { locale: it });
};

const RecentActivity = () => {
  const { transactions, loading } = useTransactions();
  
  // Mostra solo le ultime 5 transazioni
  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return (
      <div className="widget-card animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <h3 className="section-title mb-4">Attività Recente</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card animate-fade-in" style={{ animationDelay: "0.5s" }}>
      <h3 className="section-title mb-4">Attività Recente</h3>
      
      {recentTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nessuna transazione registrata</p>
          <p className="text-xs mt-1">Aggiungi la tua prima transazione</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentTransactions.map((transaction) => {
            const Icon = iconMap[transaction.icon.toLowerCase()] || MoreHorizontal;
            const isPositive = transaction.amount > 0;
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isPositive ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    <Icon className={`w-5 h-5 ${isPositive ? 'text-success' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.category} • {formatTransactionDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isPositive ? (
                    <ArrowDownLeft className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-foreground'}`}>
                    {isPositive ? '+' : ''}€{Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
