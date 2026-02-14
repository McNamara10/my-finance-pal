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

        // --- DASHBOARD PROJECTION POINTS LOGIC (5th & 10th) ---
        // To match the dashboard exactly, we calculate balance at the 5th and 10th of NEXT month.
        const calculateProjectedBalance = (targetDay: number) => {
            let balance = effectiveBalance;

            // 1. Generate events (Include Today to match useProjection.ts double-count logic)
            // Note: Index.tsx passes effectiveBalance which ALREADY has today's items, 
            // and useProjection ALSO adds today's items. We MUST match this behavior.
            const events: { date: Date, amount: number, type: 'income' | 'expense' | 'budget' }[] = [];

            // Look ahead to the target day next month
            const targetDate = new Date(now.getFullYear(), now.getMonth() + 1, targetDay);
            targetDate.setHours(23, 59, 59, 999);

            // Add Budget event (1st of next month)
            const budgetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            if (budgetDate <= targetDate) {
                events.push({ date: budgetDate, amount: budget, type: 'budget' });
            }

            // Add Recurring Incomes
            (incomes || []).forEach(inc => {
                const itemStart = inc.start_date ? new Date(inc.start_date) : new Date(2020, 0, 1);
                itemStart.setHours(0, 0, 0, 0);

                // Check occurrences for This Month (Today onwards) and Next Month (up to targetDay)
                [0, 1].forEach(mOffset => {
                    const iterMonth = new Date(now.getFullYear(), now.getMonth() + mOffset, 1);
                    const daysInMonth = new Date(iterMonth.getFullYear(), iterMonth.getMonth() + 1, 0).getDate();
                    const eventDate = new Date(iterMonth.getFullYear(), iterMonth.getMonth(), Math.min(inc.day, daysInMonth));
                    eventDate.setHours(12, 0, 0, 0);

                    if (eventDate >= now && eventDate <= targetDate && eventDate >= itemStart) {
                        events.push({ date: eventDate, amount: inc.amount, type: 'income' });
                    }
                });
            });

            // Add Recurring Expenses
            (expenses || []).forEach(exp => {
                const itemStart = exp.start_date ? new Date(exp.start_date) : new Date(2020, 0, 1);
                itemStart.setHours(0, 0, 0, 0);

                [0, 1].forEach(mOffset => {
                    const iterMonth = new Date(now.getFullYear(), now.getMonth() + mOffset, 1);
                    const daysInMonth = new Date(iterMonth.getFullYear(), iterMonth.getMonth() + 1, 0).getDate();
                    const eventDate = new Date(iterMonth.getFullYear(), iterMonth.getMonth(), Math.min(exp.day, daysInMonth));
                    eventDate.setHours(12, 0, 0, 0);

                    if (eventDate >= now && eventDate <= targetDate && eventDate >= itemStart) {
                        events.push({ date: eventDate, amount: exp.amount, type: 'expense' });
                    }
                });
            });

            // Sort and apply
            events.sort((a, b) => a.date.getTime() - b.date.getTime());
            events.forEach(e => {
                if (e.type === 'income') balance += e.amount;
                else balance -= e.amount;
                // Note: dashboard logic might not deduct budget as an event IN useProjection 
                // if sim_costOfLivingEnabled is false, but it ALWAYS subtracts it at the end.
            });

            return balance;
        };

        const projBalance5 = calculateProjectedBalance(5);
        const projBalance10 = calculateProjectedBalance(10);

        // Availability = min(projection points) - budget
        // This matches Index.tsx: availability = Math.max(0, minProjectedBalance - budget);
        const minProjectedBalance = Math.min(projBalance5, projBalance10);
        const availabilityMargin = Math.round((minProjectedBalance - budget) * 100) / 100;
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
            timestamp: now.toISOString(),
            _debug: {
                raw_balance: rawBalance,
                missing_amount: missingAmount,
                pending_today: pendingTodayIncomes - pendingTodayExpenses,
                proj_5: projBalance5,
                proj_10: projBalance10
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
