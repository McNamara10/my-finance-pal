import { useState } from "react";
import Header from "@/components/Header";
import { ArrowLeft, Plus, Trash2, Edit2, CreditCard, Home, Wifi, Zap, Car, Heart, Music, Tv, ShoppingBag, X, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

const iconOptions = [
  { value: "home", icon: Home, label: "Casa" },
  { value: "wifi", icon: Wifi, label: "Internet" },
  { value: "zap", icon: Zap, label: "Energia" },
  { value: "car", icon: Car, label: "Auto" },
  { value: "heart", icon: Heart, label: "Salute" },
  { value: "music", icon: Music, label: "Musica" },
  { value: "tv", icon: Tv, label: "Streaming" },
  { value: "creditcard", icon: CreditCard, label: "Pagamento" },
  { value: "shoppingbag", icon: ShoppingBag, label: "Shopping" },
];

const getIconComponent = (iconValue: string) => {
  const found = iconOptions.find(opt => opt.value === iconValue);
  return found ? found.icon : CreditCard;
};

interface RecurringItem {
  id: number;
  name: string;
  amount: number;
  icon: string;
  active: boolean;
  day: number;
}

const MonthlySettings = () => {
  const [expenses, setExpenses] = useLocalStorageState<RecurringItem[]>(
    "finprojection.monthlySettings.expenses",
    [
      { id: 1, name: "Affitto", amount: 650, icon: "home", active: true, day: 1 },
      { id: 2, name: "Abbonamento Internet", amount: 29.99, icon: "wifi", active: true, day: 5 },
      { id: 3, name: "Bolletta Luce", amount: 80, icon: "zap", active: true, day: 15 },
      { id: 4, name: "Assicurazione Auto", amount: 45, icon: "car", active: true, day: 20 },
      { id: 5, name: "Palestra", amount: 35, icon: "heart", active: true, day: 1 },
      { id: 6, name: "Spotify", amount: 9.99, icon: "music", active: true, day: 12 },
      { id: 7, name: "Netflix", amount: 15.99, icon: "tv", active: false, day: 8 },
    ]
  );

  const [incomes, setIncomes] = useLocalStorageState<RecurringItem[]>(
    "finprojection.monthlySettings.incomes",
    [
      { id: 1, name: "Stipendio", amount: 2200, icon: "creditcard", active: true, day: 27 },
      { id: 2, name: "Rimborso Azienda", amount: 150, icon: "shoppingbag", active: true, day: 28 },
    ]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);
  const [itemType, setItemType] = useState<"income" | "expense">("expense");
  const [formData, setFormData] = useState({ name: "", amount: "", icon: "creditcard", day: "1" });

  const totalExpenses = expenses.filter(e => e.active).reduce((sum, e) => sum + e.amount, 0);
  const totalIncomes = incomes.filter(i => i.active).reduce((sum, i) => sum + i.amount, 0);

  const openAddDialog = (type: "income" | "expense") => {
    setItemType(type);
    setEditingItem(null);
    setFormData({ name: "", amount: "", icon: "creditcard", day: "1" });
    setDialogOpen(true);
  };

  const openEditDialog = (item: RecurringItem, type: "income" | "expense") => {
    setItemType(type);
    setEditingItem(item);
    setFormData({
      name: item.name,
      amount: item.amount.toString(),
      icon: item.icon,
      day: item.day.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.amount) {
      toast.error("Compila tutti i campi");
      return;
    }

    const newItem: RecurringItem = {
      id: editingItem?.id || Date.now(),
      name: formData.name,
      amount: parseFloat(formData.amount),
      icon: formData.icon,
      day: parseInt(formData.day),
      active: editingItem?.active ?? true,
    };

    if (itemType === "income") {
      if (editingItem) {
        setIncomes(prev => prev.map(i => i.id === editingItem.id ? newItem : i));
        toast.success("Entrata aggiornata");
      } else {
        setIncomes(prev => [...prev, newItem]);
        toast.success("Entrata aggiunta");
      }
    } else {
      if (editingItem) {
        setExpenses(prev => prev.map(e => e.id === editingItem.id ? newItem : e));
        toast.success("Spesa aggiornata");
      } else {
        setExpenses(prev => [...prev, newItem]);
        toast.success("Spesa aggiunta");
      }
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: number, type: "income" | "expense") => {
    if (type === "income") {
      setIncomes(prev => prev.filter(i => i.id !== id));
      toast.success("Entrata eliminata");
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success("Spesa eliminata");
    }
  };

  const handleToggle = (id: number, type: "income" | "expense") => {
    if (type === "income") {
      setIncomes(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
    } else {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e));
    }
  };

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
              <Button size="sm" className="gap-2" onClick={() => openAddDialog("income")}>
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </div>
            
            <div className="space-y-3">
              {incomes.map((income) => {
                const Icon = getIconComponent(income.icon);
                return (
                  <div 
                    key={income.id}
                    className={`flex items-center justify-between p-4 rounded-lg bg-secondary/50 ${!income.active ? 'opacity-50' : ''}`}
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
                      <Switch checked={income.active} onCheckedChange={() => handleToggle(income.id, "income")} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(income, "income")}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(income.id, "income")}>
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
              <Button size="sm" className="gap-2" onClick={() => openAddDialog("expense")}>
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </div>
            
            <div className="space-y-3">
              {expenses.map((expense) => {
                const Icon = getIconComponent(expense.icon);
                return (
                  <div 
                    key={expense.id}
                    className={`flex items-center justify-between p-4 rounded-lg bg-secondary/50 ${!expense.active ? 'opacity-50' : ''}`}
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
                      <Switch checked={expense.active} onCheckedChange={() => handleToggle(expense.id, "expense")} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(expense, "expense")}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(expense.id, "expense")}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifica" : "Aggiungi"} {itemType === "income" ? "Entrata" : "Spesa"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="es. Affitto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Importo (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="es. 650.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="day">Giorno del mese</Label>
              <Select value={formData.day} onValueChange={(value) => setFormData(prev => ({ ...prev, day: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona giorno" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Icona</Label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map((opt) => {
                  const IconComp = opt.icon;
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={formData.icon === opt.value ? "default" : "outline"}
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setFormData(prev => ({ ...prev, icon: opt.value }))}
                    >
                      <IconComp className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlySettings;
