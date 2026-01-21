import { ShoppingCart, Coffee, Wifi, Car, CreditCard, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const transactions = [
  {
    id: 1,
    description: "Supermercato",
    category: "Spesa",
    amount: -85.50,
    date: "Oggi",
    icon: ShoppingCart,
  },
  {
    id: 2,
    description: "Stipendio",
    category: "Entrata",
    amount: 2200.00,
    date: "Oggi",
    icon: CreditCard,
  },
  {
    id: 3,
    description: "Bar Centrale",
    category: "Ristorazione",
    amount: -4.50,
    date: "Ieri",
    icon: Coffee,
  },
  {
    id: 4,
    description: "Abbonamento Internet",
    category: "Utilities",
    amount: -29.99,
    date: "20 Jan",
    icon: Wifi,
  },
  {
    id: 5,
    description: "Benzina",
    category: "Trasporti",
    amount: -55.00,
    date: "18 Jan",
    icon: Car,
  },
];

const RecentActivity = () => {
  return (
    <div className="widget-card animate-fade-in" style={{ animationDelay: "0.5s" }}>
      <h3 className="section-title mb-4">Attività Recente</h3>
      
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const Icon = transaction.icon;
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
                  <p className="text-xs text-muted-foreground">{transaction.category} • {transaction.date}</p>
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
    </div>
  );
};

export default RecentActivity;
