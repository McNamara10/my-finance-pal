import Header from "@/components/Header";
import { ArrowLeft, Plus, Search, Filter, ArrowDownLeft, ArrowUpRight, ShoppingCart, Coffee, Wifi, Car, CreditCard, Home, Zap, Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const transactions = [
  { id: 1, description: "Supermercato", category: "Spesa", amount: -85.50, date: "21 Gen 2025", icon: ShoppingCart },
  { id: 2, description: "Stipendio", category: "Entrata", amount: 2200.00, date: "21 Gen 2025", icon: CreditCard },
  { id: 3, description: "Bar Centrale", category: "Ristorazione", amount: -4.50, date: "20 Gen 2025", icon: Coffee },
  { id: 4, description: "Abbonamento Internet", category: "Utilities", amount: -29.99, date: "20 Gen 2025", icon: Wifi },
  { id: 5, description: "Benzina", category: "Trasporti", amount: -55.00, date: "18 Gen 2025", icon: Car },
  { id: 6, description: "Affitto", category: "Casa", amount: -650.00, date: "15 Gen 2025", icon: Home },
  { id: 7, description: "Bolletta Luce", category: "Utilities", amount: -78.50, date: "14 Gen 2025", icon: Zap },
  { id: 8, description: "Palestra", category: "Salute", amount: -35.00, date: "12 Gen 2025", icon: Heart },
  { id: 9, description: "Shopping Online", category: "Shopping", amount: -120.00, date: "10 Gen 2025", icon: ShoppingBag },
  { id: 10, description: "Rimborso Spese", category: "Entrata", amount: 150.00, date: "08 Gen 2025", icon: CreditCard },
];

const Transactions = () => {
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
            <Button className="gap-2">
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
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtri
            </Button>
          </div>

          {/* Transactions table */}
          <div className="widget-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const Icon = transaction.icon;
                  const isPositive = transaction.amount > 0;
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isPositive ? 'bg-success/10' : 'bg-muted'
                          }`}>
                            <Icon className={`w-5 h-5 ${isPositive ? 'text-success' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="font-medium">{transaction.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{transaction.category}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{transaction.date}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPositive ? (
                            <ArrowDownLeft className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={`font-semibold ${isPositive ? 'text-success' : 'text-foreground'}`}>
                            {isPositive ? '+' : ''}€{Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Totale Entrate</p>
              <p className="text-xl font-bold text-success">+€2.350,00</p>
            </div>
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Totale Uscite</p>
              <p className="text-xl font-bold text-foreground">-€1.058,49</p>
            </div>
            <div className="widget-card text-center">
              <p className="text-sm text-muted-foreground mb-1">Bilancio</p>
              <p className="text-xl font-bold text-success">+€1.291,51</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Transactions;
