import { useState, useEffect, useMemo } from 'react';
import Header from "@/components/Header";
import DashboardNav from "@/components/DashboardNav";
import BalanceWidget from "@/components/BalanceWidget";
import ProjectionWidget from "@/components/ProjectionWidget";
// import SalaryWidget from "@/components/SalaryWidget"; // Removed as per snippet
// import ProjectionChart from "@/components/ProjectionChart"; // Replaced
import AdvancedProjection from "@/components/AdvancedProjection";
import AvailabilityWidget from "@/components/AvailabilityWidget";
import StatusWidget, { FinancialStatus } from "@/components/StatusWidget";
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
  isAfter,
  parseISO,
  setDate,
  startOfDay,
  startOfMonth,
  getDaysInMonth,
  format,
} from "date-fns";
import { it } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Transaction } from "@/hooks/useTransactions";

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
  const { transactions, addTransaction } = useTransactions();
  const { incomes: activeIncomes } = useRecurringIncomes(); // Destructured to activeIncomes
  const { expenses: activeExpenses } = useRecurringExpenses(); // Destructured to activeExpenses

  const [isPosting, setIsPosting] = useState(false);

  const now = useMemo(() => new Date(), []);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // --- RECONCILIATION LOGIC ---
  const getMissingRecurringItems = () => {
    const missing: { item: any; date: string; type: 'income' | 'expense' }[] = [];
    let missingAmount = 0;
    const today = startOfDay(now);

    if (!activeIncomes || !activeExpenses || !transactions || transactions.length === 0) {
      return { missing: [], missingAmount: 0 };
    }

    // Identifichiamo la data della prima transazione (es. il "Saldo Attuale")
    // Consideriamo solo ricorrenze che avvengono DOPO questa data per evitare doppi conteggi.
    const firstTransactionDate = startOfDay(parseISO(transactions[transactions.length - 1].date));

    // Iniziamo dal 1° Gennaio 2026 (o dalla data di inizio dell'app)
    let currentMonth = startOfMonth(new Date(2026, 0, 1));

    while (isBefore(currentMonth, now) || isSameMonth(currentMonth, now)) {
      // Controlla Entrate
      activeIncomes.forEach(income => {
        const itemStartDate = income.start_date ? startOfDay(parseISO(income.start_date)) : new Date(2020, 0, 1);
        const daysInMonth = getDaysInMonth(currentMonth);
        const dayToSet = Math.min(income.day, daysInMonth);
        const eventDate = setDate(currentMonth, dayToSet);

        // Deve essere prima di oggi, dopo la data di inizio della ricorrenza E dopo la prima transazione registrata
        if (isBefore(eventDate, today) &&
          (isAfter(eventDate, itemStartDate) || isSameDay(eventDate, itemStartDate)) &&
          isAfter(eventDate, firstTransactionDate)) {

          const hasTransaction = transactions.some(t =>
            t.amount === income.amount &&
            isSameMonth(parseISO(t.date), currentMonth)
          );
          if (!hasTransaction) {
            missing.push({ item: income, date: format(eventDate, "yyyy-MM-dd"), type: 'income' });
            missingAmount += income.amount;
          }
        }
      });

      // Controlla Spese
      activeExpenses.forEach(expense => {
        const itemStartDate = expense.start_date ? startOfDay(parseISO(expense.start_date)) : new Date(2020, 0, 1);
        const daysInMonth = getDaysInMonth(currentMonth);
        const dayToSet = Math.min(expense.day, daysInMonth);
        const eventDate = setDate(currentMonth, dayToSet);

        if (isBefore(eventDate, today) &&
          (isAfter(eventDate, itemStartDate) || isSameDay(eventDate, itemStartDate)) &&
          isAfter(eventDate, firstTransactionDate)) {

          const hasTransaction = transactions.some(t =>
            Math.abs(t.amount) === Math.abs(expense.amount) &&
            isSameMonth(parseISO(t.date), currentMonth)
          );
          if (!hasTransaction) {
            missing.push({ item: expense, date: format(eventDate, "yyyy-MM-dd"), type: 'expense' });
            missingAmount -= expense.amount;
          }
        }
      });
      currentMonth = addMonths(currentMonth, 1);
    }
    return { missing, missingAmount };
  };

  const { missing: missingItems, missingAmount } = useMemo(() => {
    if (!transactions || !activeIncomes || !activeExpenses) {
      return { missing: [], missingAmount: 0 };
    }
    return getMissingRecurringItems();
  }, [transactions, activeIncomes, activeExpenses, now]);

  const postAllMissing = async () => {
    if (isPosting || missingItems.length === 0) return;
    setIsPosting(true);
    const toastId = toast.loading(`Inserimento di ${missingItems.length} transazioni...`);

    try {
      for (const m of missingItems) {
        await addTransaction({
          description: m.item.name,
          amount: m.type === 'income' ? m.item.amount : -m.item.amount,
          category: m.type === 'income' ? 'Entrata' : 'Spesa',
          date: m.date,
          icon: m.item.icon || 'creditcard'
        });
      }
      toast.success("Transazioni inserite correttamente", { id: toastId });
    } catch (error) {
      console.error("Error posting missing transactions:", error);
      toast.error("Si è verificato un errore durante l'inserimento", { id: toastId });
    } finally {
      setIsPosting(false);
    }
  };
  // Bilancio basato su TUTTE le transazioni fino ad oggi
  const balance = transactions ? transactions.reduce((sum, t) => sum + t.amount, 0) : 0;

  // Calcolo "Saldo Effettivo" (include ricorrenti di OGGI non ancora accreditati)
  const currentDay = now.getDate();
  const transactionsToday = transactions ? transactions.filter(t => isSameDay(parseISO(t.date), now)) : [];

  const pendingTodayIncomes = activeIncomes
    ? activeIncomes
      .filter(i => i.day === currentDay && i.active)
      .filter(i => !transactionsToday.some(t => t.amount === i.amount))
      .reduce((sum, i) => sum + i.amount, 0)
    : 0;

  const pendingTodayExpenses = activeExpenses
    ? activeExpenses
      .filter(e => e.day === currentDay && e.active)
      .filter(e => !transactionsToday.some(t => Math.abs(t.amount) === Math.abs(e.amount)))
      .reduce((sum, e) => sum + e.amount, 0)
    : 0;

  const effectiveBalance = Math.round((balance + missingAmount + pendingTodayIncomes - pendingTodayExpenses) * 100) / 100;

  // Use new Hook for advanced data - Use effectiveBalance as starting point for projections? 
  // Actually the hook uses initialBalance. If we want projections to NOT double count today's items if we already added them to initialBalance, 
  // we need to be careful. useProjection already adds today's items. 
  // So if we pass effectiveBalance (which includes today's items) to useProjection, 
  // and useProjection ALSO adds today's items, we double count.
  // We should pass the RAW balance (just transactions) and let useProjection handle the rest, 
  // OR pass effectiveBalance and make useProjection start from strictly TOMORROW.
  // But for the widget "Saldo Attuale", the user wants to see effectiveBalance.

  const projectionData5 = useProjection(effectiveBalance, activeExpenses, activeIncomes, 5);
  const projectionData10 = useProjection(effectiveBalance, activeExpenses, activeIncomes, 10);

  // We want to verify consistency between the Widgets and the Chart.
  // USER REQUIREMENT: Always show 5th and 10th of NEXT MONTH.
  const targetDate5 = setDate(addMonths(now, 1), 5);
  const targetDate10 = setDate(addMonths(now, 1), 10);

  // Select the correct data point from projections. 
  // projectionData5[0] might be this month's 5th if today < 5th. 
  // Since we want NEXT MONTH, we find the first point that is in next month.
  const projectedBalanceDay5 = projectionData5.find(p => {
    const d = p.events && p.events.length > 0 ? p.events[0].date : null;
    // Simple check: format the targetDate and find matching month string or index
    return p.month.includes(format(targetDate5, "MMM", { locale: it }));
  })?.balance || (projectionData5.length > 0 ? projectionData5[projectionData5.length - 1].balance : balance);

  const projectedBalanceDay10 = projectionData10.find(p => {
    return p.month.includes(format(targetDate10, "MMM", { locale: it }));
  })?.balance || (projectionData10.length > 0 ? projectionData10[projectionData10.length - 1].balance : balance);

  // Availability Calculation - Safer approach: use the minimum projected balance in the next month
  // This value represents what you can spend TODAY without ever going negative in the next 30 days.
  const allProjectionPoints = [...projectionData5, ...projectionData10];
  const minProjectedBalance = allProjectionPoints.length > 0
    ? Math.min(...allProjectionPoints.map(p => p.balance))
    : effectiveBalance;

  const simEnabled = localStorage.getItem("sim_costOfLivingEnabled") === "true";
  const simCost = simEnabled ? parseFloat(localStorage.getItem("sim_baseCost") || "500") : 0;

  // The "Availability" is the minimum balance we expect to have, minus simulation costs.
  const availability = Math.max(0, minProjectedBalance - simCost);

  // Status Logic
  const availabilityMargin = minProjectedBalance - simCost;
  let financialStatus: FinancialStatus = "ok";
  if (availabilityMargin < 0) {
    financialStatus = "critical";
  } else if (availabilityMargin <= 100) {
    financialStatus = "warning";
  }

  // Safety Check: check if any projection point in the NEXT 30 DAYS is < 0
  const isDanger = projectionData5.some(p => p.balance < 0) || projectionData10.some(p => p.balance < 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <DashboardNav />

        {/* Financial Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <BalanceWidget balance={effectiveBalance} />
          {/* Specific Date Projections */}
          {/* Proiezione 5 Marzo */}
          <ProjectionWidget
            projectionDateLabel={toShortItDate(targetDate5)}
            projectedBalance={projectedBalanceDay5}
            delta={projectedBalanceDay5 - effectiveBalance}
            deltaPct={effectiveBalance !== 0 ? ((projectedBalanceDay5 - effectiveBalance) / Math.abs(effectiveBalance)) * 100 : 0}
          />

          {/* Proiezione 10 Marzo */}
          <ProjectionWidget
            projectionDateLabel={toShortItDate(targetDate10)}
            projectedBalance={projectedBalanceDay10}
            delta={projectedBalanceDay10 - effectiveBalance}
            deltaPct={effectiveBalance !== 0 ? ((projectedBalanceDay10 - effectiveBalance) / Math.abs(effectiveBalance)) * 100 : 0}
          />

          {/* Availability Widget */}
          <AvailabilityWidget availability={availability} />

          {/* Status Widget */}
          <StatusWidget status={financialStatus} margin={availabilityMargin} />
        </div>

        {isDanger && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4">
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3 text-destructive">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                <span className="font-bold">!</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Attenzione: Saldo Negativo Previsto</p>
                <p className="text-xs opacity-80">Le proiezioni indicano che il tuo saldo potrebbe scendere sotto lo zero nel prossimo mese. Controlla le uscite pianificate.</p>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Projection Chart */}
        <div className="mb-6">
          <AdvancedProjection
            data5={projectionData5}
            data10={projectionData10}
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
