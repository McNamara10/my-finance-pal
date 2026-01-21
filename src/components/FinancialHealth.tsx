import { Shield, TrendingUp, PiggyBank, Target } from "lucide-react";

const tips = [
  {
    icon: PiggyBank,
    title: "Risparmio automatico",
    description: "Imposta un trasferimento automatico del 10% dello stipendio.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Target,
    title: "Obiettivo raggiungibile",
    description: "Sei al 65% del tuo obiettivo di risparmio mensile.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Fondo emergenza",
    description: "Considera di aumentare il tuo fondo per 3 mesi di spese.",
    color: "bg-warning/10 text-warning",
  },
];

const FinancialHealth = () => {
  return (
    <div className="widget-card animate-fade-in" style={{ animationDelay: "0.6s" }}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-success" />
        <h3 className="section-title">Salute Finanziaria</h3>
      </div>
      
      <div className="space-y-3">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tip.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialHealth;
