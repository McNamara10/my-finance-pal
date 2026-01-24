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
import { addMonths, endOfMonth, isBefore, isSameDay, setDate, startOfDay } from "date-fns";

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

  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const activeIncomes = incomes.filter((i) => i.active);
  const activeExpenses = expenses.filter((e) => e.active);

  const recurringIncomeTotal = activeIncomes.reduce((sum, i) => sum + i.amount, 0);
  const recurringExpenseTotal = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const projectedBalance = balance + recurringIncomeTotal - recurringExpenseTotal;
  const delta = projectedBalance - balance;
  const deltaPct = balance !== 0 ? (delta / Math.abs(balance)) * 100 : 0;

  const now = new Date();
  const projectionDateLabel = toShortItDate(endOfMonth(now));

  const nextIncomeDate = (() => {
    if (activeIncomes.length === 0) return null;
    const dates = activeIncomes
      .map((i) => nextDateForDayOfMonth(i.day, now))
      .sort((a, b) => a.getTime() - b.getTime());
    return dates[0] ?? null;
  })();

  const salaryDayLabel = nextIncomeDate
    ? isSameDay(nextIncomeDate, now)
      ? "Oggi"
      : toShortItDate(nextIncomeDate)
    : "—";

  const salaryBadgeVariant = nextIncomeDate ? "incoming" : "not-set" as const;
  const salaryBadgeLabel = nextIncomeDate ? "In arrivo" : "Non impostato";
  const salarySubtitle = nextIncomeDate
    ? "La prossima entrata ricorrente è prevista a breve"
    : "Nessuna entrata ricorrente configurata";

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
            badgeLabel={salaryBadgeLabel}
            badgeVariant={salaryBadgeVariant}
            dayLabel={salaryDayLabel}
            subtitle={salarySubtitle}
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
