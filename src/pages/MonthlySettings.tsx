import Header from "@/components/Header";
import { ArrowLeft, Plus, Trash2, Edit2, CreditCard, Home, Wifi, Zap, Car, Heart, Music, Tv, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const recurringExpenses = [
  { id: 1, name: "Affitto", amount: 650, icon: Home, active: true, day: 1 },
  { id: 2, name: "Abbonamento Internet", amount: 29.99, icon: Wifi, active: true, day: 5 },
  { id: 3, name: "Bolletta Luce", amount: 80, icon: Zap, active: true, day: 15 },
  { id: 4, name: "Assicurazione Auto", amount: 45, icon: Car, active: true, day: 20 },
  { id: 5, name: "Palestra", amount: 35, icon: Heart, active: true, day: 1 },
  { id: 6, name: "Spotify", amount: 9.99, icon: Music, active: true, day: 12 },
  { id: 7, name: "Netflix", amount: 15.99, icon: Tv, active: false, day: 8 },
];

const recurringIncomes = [
  { id: 1, name: "Stipendio", amount: 2200, icon: CreditCard, active: true, day: 27 },
  { id: 2, name: "Rimborso Azienda", amount: 150, icon: ShoppingBag, active: true, day: 28 },
];

const MonthlySettings = () => {
  const totalExpenses = recurringExpenses
    .filter(e => e.active)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalIncomes = recurringIncomes
    .filter(i => i.active)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="animate-fade-in">
          {/* Back button and title */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Impostazioni Mensili</h1>
          </div>

          {/* Monthly summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Entrate Fisse</p>
              <p className="text-xl font-bold text-success">+€{totalIncomes.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Spese Fisse</p>
              <p className="text-xl font-bold text-foreground">-€{totalExpenses.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Disponibile Mensile</p>
              <p className={`text-xl font-bold ${totalIncomes - totalExpenses > 0 ? 'text-success' : 'text-destructive'}`}>
                €{(totalIncomes - totalExpenses).toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          {/* Recurring Incomes */}
          <div className="widget-card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Entrate Ricorrenti</h2>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </div>
            
            <div className="space-y-3">
              {recurringIncomes.map((income) => {
                const Icon = income.icon;
                return (
                  <div 
                    key={income.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{income.name}</p>
                        <p className="text-xs text-muted-foreground">Giorno {income.day} del mese</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-success">+€{income.amount.toFixed(2).replace('.', ',')}</span>
                      <Switch checked={income.active} />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recurring Expenses */}
          <div className="widget-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Spese Ricorrenti</h2>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </div>
            
            <div className="space-y-3">
              {recurringExpenses.map((expense) => {
                const Icon = expense.icon;
                return (
                  <div 
                    key={expense.id}
                    className={`flex items-center justify-between p-4 rounded-lg bg-secondary/50 ${
                      !expense.active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{expense.name}</p>
                        <p className="text-xs text-muted-foreground">Giorno {expense.day} del mese</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-foreground">-€{expense.amount.toFixed(2).replace('.', ',')}</span>
                      <Switch checked={expense.active} />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MonthlySettings;
