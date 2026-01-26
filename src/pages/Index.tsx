import Header from "@/components/Header";
import DashboardNav from "@/components/DashboardNav";
import BalanceWidget from "@/components/BalanceWidget";
import ProjectionWidget from "@/components/ProjectionWidget";
import SalaryWidget from "@/components/SalaryWidget";
import ProjectionChart from "@/components/ProjectionChart";
import TipCard from "@/components/TipCard";
import RecentActivityLive from "@/components/RecentActivityLive";
import FinancialHealth from "@/components/FinancialHealth";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurringExpenses, useRecurringIncomes } from "@/hooks/useRecurringItems";
import {
  addMonths,
  endOfMonth,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  setDate,
  startOfDay,
  startOfMonth,
} from "date-fns";

const toShortItDate = (date: Date) =>
  date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });

const nextDateForDayOfMonth = (day: number, now: Date) => {
  const candidate = setDate(now, day);
  const today = startOfDay(now);
  return isBefore(candidate, today) ? addMonths(candidate, 1) : candidate;
};

const Index = () => {
  const { transactions } = useTransactions();
  const { incomes } = useRecurringIncomes();
  const { expenses } = useRecurringExpenses();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Filtra solo le transazioni del mese corrente
  const currentMonthTransactions = transactions.filter((t) => {
    const txDate = parseISO(t.date);
    return isSameMonth(txDate, now);
  });

  const balance = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const activeIncomes = incomes.filter((i) => i.active);
  const activeExpenses = expenses.filter((e) => e.active);

  const today = now.getDate();

  // Somma solo le entrate ricorrenti che devono ancora arrivare questo mese
  const futureIncomeTotal = activeIncomes
    .filter((i) => i.day > today)
    .reduce((sum, i) => sum + i.amount, 0);

  // Somma solo le spese ricorrenti che devono ancora arrivare questo mese
  const futureExpenseTotal = activeExpenses
    .filter((e) => e.day > today)
    .reduce((sum, e) => sum + e.amount, 0);

  const projectedBalance = balance + futureIncomeTotal - futureExpenseTotal;
  const delta = projectedBalance - balance;
  const deltaPct = balance !== 0 ? (delta / Math.abs(balance)) * 100 : 0;

  const projectionDateLabel = toShortItDate(monthEnd);

  // Calcola la data del prossimo stipendio (mese successivo)
  const nextSalaryData = (() => {
    if (activeIncomes.length === 0) return null;
    
    // Trova l'entrata principale (stipendio) - la prima per ordine di giorno
    const mainIncome = activeIncomes[0];
    const nextSalaryDate = addMonths(setDate(now, mainIncome.day), 1);
    
    // Calcola le spese rimanenti di questo mese (giorno > oggi)
    const remainingThisMonthExpenses = activeExpenses
      .filter((e) => e.day > today)
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Calcola le spese del mese prossimo prima dello stipendio
    const nextMonthExpensesBeforeSalary = activeExpenses
      .filter((e) => e.day < mainIncome.day)
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Proiezione = saldo attuale - spese rimanenti questo mese - spese prossimo mese prima dello stipendio + stipendio
    const projectedAtSalary = balance - remainingThisMonthExpenses - nextMonthExpensesBeforeSalary + mainIncome.amount;
    
    return {
      date: nextSalaryDate,
      projectedBalance: projectedAtSalary,
      salaryAmount: mainIncome.amount,
    };
  })();

  const salaryDateLabel = nextSalaryData
    ? toShortItDate(nextSalaryData.date)
    : "—";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <DashboardNav />

        {/* Financial Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <BalanceWidget balance={balance} />
          <ProjectionWidget
            projectionDateLabel={projectionDateLabel}
            projectedBalance={projectedBalance}
            delta={delta}
            deltaPct={deltaPct}
          />
          <SalaryWidget
            dateLabel={salaryDateLabel}
            projectedBalance={nextSalaryData?.projectedBalance ?? 0}
            salaryAmount={nextSalaryData?.salaryAmount ?? 0}
            hasData={nextSalaryData !== null}
          />
        </div>

        {/* Projection Chart */}
        <div className="mb-6">
          <ProjectionChart />
        </div>

        {/* Tip Card */}
        <div className="mb-6">
          <TipCard />
        </div>

        {/* Activity & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecentActivityLive />
          <FinancialHealth />
        </div>
      </main>
    </div>
  );
};

export default Index;
