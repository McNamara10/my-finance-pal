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

        // 1. Fetch all transactions for balance
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId);

        if (txError) throw txError;

        // 2. Fetch recurring items for effective balance
        const [{ data: incomes }, { data: expenses }] = await Promise.all([
            supabase.from('recurring_incomes').select('*').eq('user_id', userId).eq('active', true),
            supabase.from('recurring_expenses').select('*').eq('user_id', userId).eq('active', true)
        ]);

        // Calculate raw balance
        const rawBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Calculate effective balance logic (same as Index.tsx)
        const transactionsToday = transactions.filter(t => {
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

        const effectiveBalance = Math.round((rawBalance + pendingTodayIncomes - pendingTodayExpenses) * 100) / 100;

        const budget = parseFloat(url.searchParams.get('budget') || '500');

        // 3. Calculate Monthly Expenses (Actuals)
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        const monthlyExpenses = transactions
            .filter(t => {
                const d = new Date(t.date);
                return d >= startOfMonth && d <= endOfMonth && t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // 4. Calculate Availability and Status
        // Expenses remaining this month (after today inclusive)
        const remainingFixedExpenses = (expenses || [])
            .filter(e => e.day >= currentDay)
            .filter(e => {
                if (e.day === currentDay) {
                    return !transactionsToday.some(t => Math.abs(t.amount) === Math.abs(e.amount));
                }
                return true;
            })
            .reduce((sum, e) => sum + e.amount, 0);

        const availabilityMargin = Math.round((effectiveBalance - remainingFixedExpenses - budget) * 100) / 100;
        const availability = Math.max(0, availabilityMargin);

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
        if (field && responseData[field as keyof typeof responseData] !== undefined) {
            return new Response(
                JSON.stringify({ [field]: responseData[field as keyof typeof responseData] }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
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
