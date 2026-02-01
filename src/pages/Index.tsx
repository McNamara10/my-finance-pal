import Header from "@/components/Header";
import DashboardNav from "@/components/DashboardNav";
import BalanceWidget from "@/components/BalanceWidget";
import ProjectionWidget from "@/components/ProjectionWidget";
// import SalaryWidget from "@/components/SalaryWidget"; // Removed as per snippet
// import ProjectionChart from "@/components/ProjectionChart"; // Replaced
import AdvancedProjection from "@/components/AdvancedProjection";
import TipCard from "@/components/TipCard";
import RecentActivityLive from "@/components/RecentActivityLive";
import FinancialHealth from "@/components/FinancialHealth";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurringExpenses, useRecurringIncomes } from "@/hooks/useRecurringItems";
import { useProjection } from "@/hooks/useProjection";
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
  format, // Added format
} from "date-fns";
import { it } from 'date-fns/locale'; // Added locale

const toShortItDate = (d: Date) => format(d, "d MMM", { locale: it }); // Modified to use format and locale

const nextDateForDayOfMonth = (day: number, current: Date) => {
  const candidate = setDate(current, day);
  // If candidate is before today, move to next month
  // But be careful: if today is 20th and day is 5th, next occurrence is 5th next month.
  // If today is 20th and day is 25th, next occurrence is 25th this month.
  // We want strictly future dates? Or today inclusive? usually future or today.

  // Simple logic: if candidate < today (ignoring time), add 1 month.
  // We compare timestamps to be safe or set times to 0.
  const nowStart = new Date(current);
  nowStart.setHours(0, 0, 0, 0);
  const candStart = new Date(candidate);
  candStart.setHours(0, 0, 0, 0);

  return candStart < nowStart ? addMonths(candidate, 1) : candidate;
};

const Index = () => {
  const { transactions } = useTransactions();
  const { incomes: activeIncomes } = useRecurringIncomes(); // Destructured to activeIncomes
  const { expenses: activeExpenses } = useRecurringExpenses(); // Destructured to activeExpenses

  const now = new Date();
  const monthStart = startOfMonth(now); // Kept for potential future use, though not used in snippet
  const monthEnd = endOfMonth(now); // Kept for potential future use, though not used in snippet

  // Bilancio basato su TUTTE le transazioni fino ad oggi
  const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Use new Hook for advanced data
  const projectionData = useProjection(balance, activeExpenses, activeIncomes);

  const today = now.getDate(); // Kept for potential future use, though not used in snippet

  // Algoritmo "Next Occurrence Only":
  // Per ogni voce ricorrente, consideriamo solo la PROSSIMA occorrenza se cade entro la data target
  // E se cade DOPO la data di inizio della ricorrenza.
  const calculatePrudentProjection = (targetDate: Date, includeIncomes: boolean) => {
    let projected = balance;

    // Gestione Spese
    activeExpenses.forEach(expense => {
      if (!expense.active) return; // Added active check
      const nextOccur = nextDateForDayOfMonth(expense.day, now);
      const startDateStr = expense.start_date || '2026-01-01';
      const startDate = parseISO(startDateStr);
      if ((isBefore(nextOccur, targetDate) || isSameDay(nextOccur, targetDate)) &&
        (isBefore(startDate, nextOccur) || isSameDay(startDate, nextOccur))) {
        projected -= expense.amount;
      }
    });

    // Gestione Entrate
    if (includeIncomes) {
      activeIncomes.forEach(income => {
        if (!income.active) return; // Added active check
        const nextOccur = nextDateForDayOfMonth(income.day, now);
        const startDateStr = income.start_date || '2026-01-01';
        const startDate = parseISO(startDateStr);
        if ((isBefore(nextOccur, targetDate) || isSameDay(nextOccur, targetDate)) &&
          (isBefore(startDate, nextOccur) || isSameDay(startDate, nextOccur))) {
          projected += income.amount;
        }
      });
    }

    // Add simulated Cost of Living for these specific dates?
    // The user just enabled it in monthly settings.
    // For consistency, let's include it if enabled, pro-rated?
    // Or just keep these widgets simple as "Recurring only".
    // User request was focused on the chart. Let's leave these widgets as "Recurring Projections" for now.
    return projected;
  };

  const targetDate5 = setDate(addMonths(now, 1), 5);
  const targetDate10 = setDate(addMonths(now, 1), 10);

  const projectedBalanceDay5 = calculatePrudentProjection(targetDate5, false);
  const projectedBalanceDay10 = calculatePrudentProjection(targetDate10, true);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <DashboardNav />

        {/* Financial Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <BalanceWidget balance={balance} />
          {/* Specific Date Projections */}
          {/* Proiezione 5 Marzo */}
          <ProjectionWidget
            projectionDateLabel={toShortItDate(targetDate5)}
            projectedBalance={projectedBalanceDay5}
            delta={projectedBalanceDay5 - balance}
            deltaPct={balance !== 0 ? ((projectedBalanceDay5 - balance) / Math.abs(balance)) * 100 : 0}
          />

          {/* Proiezione 10 Marzo */}
          <ProjectionWidget
            projectionDateLabel={toShortItDate(targetDate10)}
            projectedBalance={projectedBalanceDay10}
            delta={projectedBalanceDay10 - balance}
            deltaPct={balance !== 0 ? ((projectedBalanceDay10 - balance) / Math.abs(balance)) * 100 : 0}
          />
        </div>

        {/* Advanced Projection Chart */}
        <div className="mb-6">
          <AdvancedProjection
            data={projectionData}
            expenses={activeExpenses}
            incomes={activeIncomes}
          />
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
