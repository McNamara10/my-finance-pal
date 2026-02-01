import { useState } from "react";
import Header from "@/components/Header";
import { ArrowLeft, Plus, Search, ArrowDownLeft, ArrowUpRight, ShoppingCart, Coffee, Wifi, Car, CreditCard, Home, Zap, Heart, ShoppingBag, Trash2, Edit2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useTransactions } from "@/hooks/useTransactions";

const iconOptions = [
  { value: "shoppingcart", icon: ShoppingCart, label: "Spesa" },
  { value: "coffee", icon: Coffee, label: "Ristorazione" },
  { value: "wifi", icon: Wifi, label: "Utilities" },
  { value: "car", icon: Car, label: "Trasporti" },
  { value: "creditcard", icon: CreditCard, label: "Pagamento" },
  { value: "home", icon: Home, label: "Casa" },
  { value: "zap", icon: Zap, label: "Energia" },
  { value: "heart", icon: Heart, label: "Salute" },
  { value: "shoppingbag", icon: ShoppingBag, label: "Shopping" },
];

const categoryOptions = [
  "Spesa", "Ristorazione", "Utilities", "Trasporti", "Entrata", "Casa", "Salute", "Shopping", "Altro"
];

const getIconComponent = (iconValue: string) => {
  const found = iconOptions.find(opt => opt.value === iconValue);
  return found ? found.icon : CreditCard;
};

const Transactions = () => {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<{ id: string } | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    category: "Spesa",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    icon: "shoppingcart",
    isIncome: false,
  });

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const openAddDialog = () => {
    setEditingTransaction(null);
    setFormData({
      description: "",
      category: "Spesa",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      icon: "shoppingcart",
      isIncome: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (transaction: { id: string; description: string; category: string; amount: number; date: string; icon: string }) => {
    setEditingTransaction({ id: transaction.id });
    setFormData({
      description: transaction.description,
      category: transaction.category,
      amount: Math.abs(transaction.amount).toString(),
      date: transaction.date,
      icon: transaction.icon,
      isIncome: transaction.amount > 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      toast.error("Compila tutti i campi");
      return;
    }

    const amount = parseFloat(formData.amount) * (formData.isIncome ? 1 : -1);

    const transactionData = {
      description: formData.description,
      category: formData.category,
      amount,
      date: formData.date,
      icon: formData.icon,
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, transactionData);
    } else {
      await addTransaction(transactionData);
    }

    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
  };

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Transazioni</h1>
            </div>
            <Button className="gap-2" onClick={openAddDialog}>
              <Plus className="w-4 h-4" />
              Nuova Transazione
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca transazioni..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Transactions table */}
          <div className="widget-card">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nessuna transazione trovata</p>
                <Button className="mt-4" onClick={openAddDialog}>
                  Aggiungi la prima transazione
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const Icon = getIconComponent(transaction.icon);
                    const isPositive = transaction.amount > 0;

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPositive ? 'bg-success/10' : 'bg-destructive/10'
                              }`}>
                              <Icon className={`w-5 h-5 ${isPositive ? 'text-success' : 'text-destructive'}`} />
                            </div>
                            <span className="font-medium">{transaction.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{transaction.category}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{formatDate(transaction.date)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPositive ? (
                              <ArrowUpRight className="w-4 h-4 text-success" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4 text-destructive" />
                            )}
                            <span className={`font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                              {isPositive ? '+' : '-'}€{Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(transaction)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(transaction.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Totale Entrate</p>
              <p className="text-xl font-bold text-success">+€{totalIncome.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Totale Uscite</p>
              <p className="text-xl font-bold text-destructive">-€{totalExpense.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Bilancio</p>
              <p className={`text-xl font-bold ${totalIncome - totalExpense > 0 ? 'text-success' : 'text-destructive'}`}>
                {totalIncome - totalExpense > 0 ? '+' : ''}€{(totalIncome - totalExpense).toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? "Modifica Transazione" : "Nuova Transazione"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!formData.isIncome ? "default" : "outline"}
                className="flex-1"
                onClick={() => setFormData(prev => ({ ...prev, isIncome: false }))}
              >
                Uscita
              </Button>
              <Button
                type="button"
                variant={formData.isIncome ? "default" : "outline"}
                className="flex-1"
                onClick={() => setFormData(prev => ({ ...prev, isIncome: true, category: "Entrata" }))}
              >
                Entrata
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="es. Supermercato"
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
                placeholder="es. 50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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

export default Transactions;
