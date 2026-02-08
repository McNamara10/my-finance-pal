import { useState, useEffect } from 'react';
import { addMonths, format, setDate, isBefore, isAfter, isSameDay, parseISO, startOfDay, getDaysInMonth, lastDayOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { RecurringItem } from './useRecurringItems';

interface ProjectionData {
    month: string;
    balance: number;
    income: number;
    expenses: number;
    costOfLiving: number;
    net: number;
    events: FinancialEvent[];
}

interface FinancialEvent {
    date: Date;
    amount: number;
    type: 'income' | 'expense' | 'costOfLiving';
    name?: string;
}

export const useProjection = (
    initialBalance: number,
    expenses: RecurringItem[],
    incomes: RecurringItem[],
    targetDay: number = 5
) => {
    const [data, setData] = useState<ProjectionData[]>([]);

    useEffect(() => {
        const calculateProjection = () => {
            const now = startOfDay(new Date());

            // Load Simulation Settings
            const simEnabled = localStorage.getItem("sim_costOfLivingEnabled") === "true";
            const simCost = simEnabled ? parseFloat(localStorage.getItem("sim_baseCost") || "500") : 0;

            // Generate all events for the next 13 months
            const events: FinancialEvent[] = [];
            const monthsToProject = 13; // Extra month to cover overlaps
            const endDate = addMonths(now, monthsToProject);

            // Helper to add events
            const addRecurringEvents = (items: RecurringItem[], type: 'income' | 'expense') => {
                items.filter(item => item.active).forEach(item => {
                    const itemStartDate = item.start_date ? startOfDay(parseISO(item.start_date)) : new Date('2020-01-01');

                    // Iterate through months to find occurrences
                    let currentMonth = now;
                    // We look back 1 month just in case the day is very close and we missed it? 
                    // No, strict forward looking from 'now'.
                    // Use a loop from current month up to end date
                    for (let i = 0; i <= monthsToProject; i++) {
                        const targetMonth = addMonths(now, i);
                        const daysInMonth = getDaysInMonth(targetMonth);

                        // Handle day overflow (e.g. 30th in Feb)
                        // If item.day > daysInMonth, usually it executes on the last day
                        const dayToSet = Math.min(item.day, daysInMonth);
                        const eventDate = setDate(targetMonth, dayToSet);

                        // Only add if it's today or in the future and after item start date
                        if ((isAfter(eventDate, now) || isSameDay(eventDate, now)) && (isAfter(eventDate, itemStartDate) || isSameDay(eventDate, itemStartDate))) {
                            events.push({
                                date: eventDate,
                                amount: item.amount,
                                type,
                                name: item.name
                            });
                        }
                    }
                });
            };

            addRecurringEvents(incomes, 'income');
            addRecurringEvents(expenses, 'expense');

            // Add Cost of Living (assumed 1st of each month?)
            if (simCost > 0) {
                for (let i = 0; i <= monthsToProject; i++) {
                    const targetMonth = addMonths(now, i);
                    const eventDate = setDate(targetMonth, 1); // 1st of month
                    if (isAfter(eventDate, now) || isSameDay(eventDate, now)) {
                        events.push({
                            date: eventDate,
                            amount: simCost,
                            type: 'costOfLiving',
                            name: 'Budget Spese Preventivate'
                        });
                    }
                }
            }

            // Sort events by date
            events.sort((a, b) => a.date.getTime() - b.date.getTime());

            // Calculate Projection Points (5th of each month)
            const projection: ProjectionData[] = [];
            let currentBalance = initialBalance;
            let currentEventIndex = 0;

            for (let i = 0; i < 13; i++) {
                // Find the next occurrence of targetDay
                let targetDate = setDate(addMonths(now, i), targetDay);

                // If this target date is in the past, skip it for the projection points
                if (isBefore(targetDate, now) && !isSameDay(targetDate, now)) {
                    continue;
                }

                // We want to limit to 12 points
                if (projection.length >= 12) break;

                // Accumulate events up to this target date
                let monthlyIncome = 0;
                let monthlyExpenses = 0;
                let monthlyCostOfLiving = 0;
                const monthlyEvents: FinancialEvent[] = [];

                while (currentEventIndex < events.length &&
                    (isBefore(events[currentEventIndex].date, targetDate) || isSameDay(events[currentEventIndex].date, targetDate))) {

                    const event = events[currentEventIndex];
                    if (event.type === 'income') {
                        currentBalance += event.amount;
                        monthlyIncome += event.amount;
                    } else if (event.type === 'expense') {
                        currentBalance -= event.amount;
                        monthlyExpenses += event.amount;
                    } else if (event.type === 'costOfLiving') {
                        currentBalance -= event.amount;
                        monthlyCostOfLiving += event.amount;
                    }
                    monthlyEvents.push(event);
                    currentEventIndex++;
                }

                // Note: monthlyIncome/Expenses here tracks the flow since the LAST projection point (or Now).
                // But the UI labels it as "Income" for that month.
                // This accumulation strategy shows "Flow since previous point".
                // This is mathematically correct for the balance.

                projection.push({
                    month: format(targetDate, "d MMM", { locale: it }),
                    balance: currentBalance,
                    income: monthlyIncome,
                    expenses: monthlyExpenses,
                    costOfLiving: monthlyCostOfLiving,
                    net: monthlyIncome - monthlyExpenses - monthlyCostOfLiving,
                    events: monthlyEvents
                });
            }

            setData(projection);
        };

        calculateProjection();
        const handleStorageChange = () => calculateProjection();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);

    }, [initialBalance, expenses, incomes, targetDay]);

    return data;
};
