import { useState, useEffect } from 'react';
import { addMonths, format, setDate, startOfDay, isBefore, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { RecurringItem } from './useRecurringItems';

interface ProjectionData {
    month: string;
    balance: number;
    income: number;
    expenses: number;
    costOfLiving: number;
    net: number;
}

export const useProjection = (
    initialBalance: number,
    expenses: RecurringItem[],
    incomes: RecurringItem[]
) => {
    const [data, setData] = useState<ProjectionData[]>([]);

    useEffect(() => {
        const calculateProjection = () => {
            const now = new Date();
            let currentBalance = initialBalance;
            const projection: ProjectionData[] = [];

            // Load Simulation Settings
            const simEnabled = localStorage.getItem("sim_costOfLivingEnabled") === "true";
            const simCost = simEnabled ? parseFloat(localStorage.getItem("sim_baseCost") || "500") : 0;

            for (let i = 0; i < 12; i++) {
                const targetDate = addMonths(now, i + 1);
                // End of month projection usually, or same day next month. 
                // Let's go with "End of Month" logic for clearer charts or "1st of next month".
                // The user wants "Mese per mese", so let's project the balance at the END of each future month.
                const monthEnd = setDate(targetDate, 1); // 1st of month (simplification for labeling)

                let monthIncome = 0;
                let monthExpenses = 0;

                // Calculate active recurring items for this month
                // We assume items occur once a month
                incomes.filter(item => item.active).forEach(item => {
                    // Simple check: does it start before this month?
                    const startDate = item.start_date ? parseISO(item.start_date) : new Date('2020-01-01');
                    if (isBefore(startDate, monthEnd) || isSameDay(startDate, monthEnd)) {
                        monthIncome += item.amount;
                    }
                });

                expenses.filter(item => item.active).forEach(item => {
                    const startDate = item.start_date ? parseISO(item.start_date) : new Date('2020-01-01');
                    if (isBefore(startDate, monthEnd) || isSameDay(startDate, monthEnd)) {
                        monthExpenses += item.amount;
                    }
                });

                const net = monthIncome - monthExpenses - simCost;
                currentBalance += net;

                projection.push({
                    month: format(monthEnd, "MMM", { locale: it }), // "Gen", "Feb"
                    balance: currentBalance,
                    income: monthIncome,
                    expenses: monthExpenses,
                    costOfLiving: simCost,
                    net: net
                });
            }

            setData(projection);
        };

        calculateProjection();

        // Listen for storage events to update recalculation when settings change in another tab/window
        // (Or same window if we dispatch event)
        const handleStorageChange = () => calculateProjection();
        window.addEventListener('storage', handleStorageChange);

        return () => window.removeEventListener('storage', handleStorageChange);

    }, [initialBalance, expenses, incomes]);

    return data;
};
