import { useState } from "react";
import Header from "@/components/Header";
import { ArrowLeft, Plus, Trash2, Edit2, CreditCard, Home, Wifi, Zap, Car, Heart, Music, Tv, ShoppingBag, Check } from "lucide-react";
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
import { useRecurringExpenses, useRecurringIncomes, RecurringItem } from "@/hooks/useRecurringItems";

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

const MonthlySettings = () => {
  const {
    expenses,
    loading: expensesLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleExpense,
  } = useRecurringExpenses();

  const {
    incomes,
    loading: incomesLoading,
    addIncome,
    updateIncome,
    deleteIncome,
    toggleIncome,
  } = useRecurringIncomes();

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

  const handleSave = async () => {
    if (!formData.name || !formData.amount) {
      toast.error("Compila tutti i campi");
      return;
    }

    const itemData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      icon: formData.icon,
      day: parseInt(formData.day),
      active: editingItem?.active ?? true,
    };

    if (itemType === "income") {
      if (editingItem) {
        await updateIncome(editingItem.id, itemData);
      } else {
        await addIncome(itemData);
      }
    } else {
      if (editingItem) {
        await updateExpense(editingItem.id, itemData);
      } else {
        await addExpense(itemData);
      }
    }

    setDialogOpen(false);
  };

  const handleDelete = async (id: string, type: "income" | "expense") => {
    if (type === "income") {
      await deleteIncome(id);
    } else {
      await deleteExpense(id);
    }
  };

  const handleToggle = async (id: string, type: "income" | "expense") => {
    if (type === "income") {
      await toggleIncome(id);
    } else {
      await toggleExpense(id);
    }
  };

  const loading = expensesLoading || incomesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </main>
      </div>
    );
  }

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
            
            {incomes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nessuna entrata ricorrente</p>
            ) : (
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
            )}
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
            
            {expenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nessuna spesa ricorrente</p>
            ) : (
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
            )}
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
