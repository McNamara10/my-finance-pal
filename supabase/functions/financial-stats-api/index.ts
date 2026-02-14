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

        // --- DASHBOARD PROJECTION LOGIC (MATCHING Index.tsx) ---
        // 1. Calculate the minimum projected balance over the next 12 months at 5th and 10th checkpoints.
        // 2. We only project Recurring Incomes and Expenses here (matching useProjection.ts when budget is handled separately).
        const getMinProjectedBalance = () => {
            let minBalance = effectiveBalance;

            // We check the next 12 months
            for (let m = 1; m <= 12; m++) {
                [5, 10].forEach(targetDay => {
                    let balanceForPoint = effectiveBalance;
                    const targetDate = new Date(now.getFullYear(), now.getMonth() + m, targetDay);
                    targetDate.setHours(23, 59, 59, 999);

                    // Collect all events between Now and this checkpoint
                    // Recurring Incomes
                    (incomes || []).forEach(inc => {
                        const itemStart = inc.start_date ? new Date(inc.start_date) : new Date(2020, 0, 1);
                        itemStart.setHours(0, 0, 0, 0);

                        // Check occurrences for current and future months up to the point
                        for (let i = 0; i <= m; i++) {
                            const iterMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
                            const daysInMonth = new Date(iterMonth.getFullYear(), iterMonth.getMonth() + 1, 0).getDate();
                            const eventDate = new Date(iterMonth.getFullYear(), iterMonth.getMonth(), Math.min(inc.day, daysInMonth));
                            eventDate.setHours(12, 0, 0, 0);

                            // Match Dashboard Bug: Index.tsx already has today's pending items in effectiveBalance,
                            // but useProjection.ts ALSO adds them if eventDate is Today.
                            if ((eventDate >= now || eventDate.toDateString() === now.toDateString()) && eventDate <= targetDate && eventDate >= itemStart) {
                                balanceForPoint += inc.amount;
                            }
                        }
                    });

                    // Recurring Expenses
                    (expenses || []).forEach(exp => {
                        const itemStart = exp.start_date ? new Date(exp.start_date) : new Date(2020, 0, 1);
                        itemStart.setHours(0, 0, 0, 0);

                        for (let i = 0; i <= m; i++) {
                            const iterMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
                            const daysInMonth = new Date(iterMonth.getFullYear(), iterMonth.getMonth() + 1, 0).getDate();
                            const eventDate = new Date(iterMonth.getFullYear(), iterMonth.getMonth(), Math.min(exp.day, daysInMonth));
                            eventDate.setHours(12, 0, 0, 0);

                            if ((eventDate >= now || eventDate.toDateString() === now.toDateString()) && eventDate <= targetDate && eventDate >= itemStart) {
                                balanceForPoint -= exp.amount;
                            }
                        }
                    });

                    if (balanceForPoint < minBalance) {
                        minBalance = balanceForPoint;
                    }
                });
            }
            return minBalance;
        };

        const minProjectedBalance = getMinProjectedBalance();

        // Availability = (Lowest point in 12 months) - (Single budget deduction)
        // This matches Index.tsx: availability = Math.max(0, minProjectedBalance - simCost);
        const availabilityMargin = Math.round((minProjectedBalance - budget) * 100) / 100;
        const availability = Math.max(0, availabilityMargin);

        // 3. Calculate Monthly Expenses (Actuals)
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        const monthlyExpenses = (transactions || []).filter(t => {
            const d = new Date(t.date);
            return d >= startOfMonth && d <= endOfMonth && t.amount < 0;
        }).reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
            timestamp: now.toISOString(),
            _debug: {
                raw_balance: rawBalance,
                effective_balance: effectiveBalance,
                min_projected_12m: minProjectedBalance,
                budget_deducted: budget
            }
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
