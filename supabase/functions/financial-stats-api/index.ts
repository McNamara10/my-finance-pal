import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = user.id;
        const url = new URL(req.url);
        const method = req.method;

        if (method !== 'GET') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Fetch all transactions for balance (ordered by date to find the first one)
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true });

        if (txError) throw txError;

        // 2. Fetch recurring items for effective balance
        const [{ data: incomes }, { data: expenses }] = await Promise.all([
            supabase.from('recurring_incomes').select('*').eq('user_id', userId).eq('active', true),
            supabase.from('recurring_expenses').select('*').eq('user_id', userId).eq('active', true)
        ]);

        // Calculate raw balance
        const rawBalance = (transactions || []).reduce((sum, t) => sum + t.amount, 0);

        // --- RECONCILIATION LOGIC (MATCHING Index.tsx) ---
        let missingAmount = 0;

        if (transactions && transactions.length > 0 && incomes && expenses) {
            // First transaction date is our anchor
            const firstTxDate = new Date(transactions[0].date);
            firstTxDate.setHours(0, 0, 0, 0);

            // Reconciliation starts from 2026-01-01
            let iterMonth = new Date(2026, 0, 1);
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            while (iterMonth <= todayStart) {
                const iterYear = iterMonth.getFullYear();
                const iterMonthIdx = iterMonth.getMonth();
                const daysInMonth = new Date(iterYear, iterMonthIdx + 1, 0).getDate();

                // Check Incomes
                incomes.forEach(income => {
                    const itemStart = income.start_date ? new Date(income.start_date) : new Date(2020, 0, 1);
                    itemStart.setHours(0, 0, 0, 0);

                    const dayToSet = Math.min(income.day, daysInMonth);
                    const eventDate = new Date(iterYear, iterMonthIdx, dayToSet);

                    if (eventDate < todayStart &&
                        eventDate >= itemStart &&
                        eventDate > firstTxDate) {

                        const hasTx = transactions.some(t => {
                            const d = new Date(t.date);
                            return t.amount === income.amount &&
                                d.getMonth() === iterMonthIdx &&
                                d.getFullYear() === iterYear;
                        });

                        if (!hasTx) {
                            missingAmount += income.amount;
                        }
                    }
                });

                // Check Expenses
                expenses.forEach(expense => {
                    const itemStart = expense.start_date ? new Date(expense.start_date) : new Date(2020, 0, 1);
                    itemStart.setHours(0, 0, 0, 0);

                    const dayToSet = Math.min(expense.day, daysInMonth);
                    const eventDate = new Date(iterYear, iterMonthIdx, dayToSet);

                    if (eventDate < todayStart &&
                        eventDate >= itemStart &&
                        eventDate > firstTxDate) {

                        const hasTx = transactions.some(t => {
                            const d = new Date(t.date);
                            return Math.abs(t.amount) === Math.abs(expense.amount) &&
                                d.getMonth() === iterMonthIdx &&
                                d.getFullYear() === iterYear;
                        });

                        if (!hasTx) {
                            missingAmount -= expense.amount;
                        }
                    }
                });

                iterMonth.setMonth(iterMonth.getMonth() + 1);
            }
        }

        // Calculate "Pending Today" logic
        const transactionsToday = (transactions || []).filter(t => {
            const d = new Date(t.date);
            return d.getDate() === currentDay && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const pendingTodayIncomes = (incomes || [])
            .filter(i => i.day === currentDay)
            .filter(i => !transactionsToday.some(t => t.amount === i.amount))
            .reduce((sum, i) => sum + i.amount, 0);

        const pendingTodayExpenses = (expenses || [])
            .filter(e => e.day === currentDay)
            .filter(e => !transactionsToday.some(t => Math.abs(t.amount) === Math.abs(e.amount)))
            .reduce((sum, e) => sum + e.amount, 0);

        const effectiveBalance = Math.round((rawBalance + missingAmount + pendingTodayIncomes - pendingTodayExpenses) * 100) / 100;

        const budget = parseFloat(url.searchParams.get('budget') || '500');

        // --- 30-DAY PROJECTION LOGIC (MATCHING Dashboard Availability) ---
        // We simulate day-by-day for the next 30 days to find the minimum balance reached.
        let minProjectedBalance = effectiveBalance;
        let runningBalance = effectiveBalance;

        for (let i = 1; i <= 30; i++) {
            const projectionDate = new Date(now);
            projectionDate.setDate(now.getDate() + i);
            projectionDate.setHours(0, 0, 0, 0);

            const projDay = projectionDate.getDate();
            const projMonth = projectionDate.getMonth();
            const projYear = projectionDate.getFullYear();

            // 1. Check for Recurring Budget (Cost of Living) on the 1st
            if (projDay === 1) {
                runningBalance -= budget;
            }

            // 2. Check for Recurring Incomes
            (incomes || []).forEach(income => {
                const itemStart = income.start_date ? new Date(income.start_date) : new Date(2020, 0, 1);
                itemStart.setHours(0, 0, 0, 0);

                const daysInMonth = new Date(projYear, projMonth + 1, 0).getDate();
                const dayToSet = Math.min(income.day, daysInMonth);

                if (projDay === dayToSet && projectionDate >= itemStart) {
                    runningBalance += income.amount;
                }
            });

            // 3. Check for Recurring Expenses
            (expenses || []).forEach(expense => {
                const itemStart = expense.start_date ? new Date(expense.start_date) : new Date(2020, 0, 1);
                itemStart.setHours(0, 0, 0, 0);

                const daysInMonth = new Date(projYear, projMonth + 1, 0).getDate();
                const dayToSet = Math.min(expense.day, daysInMonth);

                if (projDay === dayToSet && projectionDate >= itemStart) {
                    runningBalance -= expense.amount;
                }
            });

            if (runningBalance < minProjectedBalance) {
                minProjectedBalance = runningBalance;
            }
        }

        // Availability calculation: min balance reached in 30 days, minus the budget margin 
        // Logic in Index.tsx: availability = Math.max(0, minProjectedBalance - simCost);
        // Note: Our day loop above already deducts budget if the 1st falls in the next 30 days.
        // But dashboard budget is usually for "this month".
        // Let's match the exact dashboard logic if possible.
        // Dashboard uses min(...) of specific projection points.

        const availabilityMargin = Math.round((minProjectedBalance) * 100) / 100;
        const availability = Math.max(0, availabilityMargin);

        // 3. Calculate Monthly Expenses (Actuals)
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        const monthlyExpenses = (transactions || [])
            .filter(t => {
                const d = new Date(t.date);
                return d >= startOfMonth && d <= endOfMonth && t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        let financialStatus = 'ok';
        if (availabilityMargin < 0) {
            financialStatus = 'critical';
        } else if (availabilityMargin <= 100) {
            financialStatus = 'warning';
        }

        const responseData = {
            total_balance: effectiveBalance,
            monthly_expenses: Math.round(monthlyExpenses * 100) / 100,
            availability: availability,
            availability_margin: availabilityMargin,
            financial_status: financialStatus,
            budget_used: budget,
            currency: 'EUR',
            timestamp: now.toISOString()
        };

        const field = url.searchParams.get('field');
        if (field) {
            const normalizedQueryField = field.replace(/_/g, '').toLowerCase();
            const matchingKey = (Object.keys(responseData) as Array<keyof typeof responseData>).find(key =>
                key.replace(/_/g, '').toLowerCase() === normalizedQueryField
            );

            if (matchingKey) {
                return new Response(
                    JSON.stringify({ [field]: responseData[matchingKey] }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        return new Response(
            JSON.stringify(responseData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[financial-stats-api] Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
