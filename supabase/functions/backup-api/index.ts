import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    console.log(`[backup-api] Backup request from user ${userId}`);

    if (req.method === 'GET') {
      // Export all user data
      const [transactionsRes, expensesRes, incomesRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('recurring_expenses').select('*').eq('user_id', userId),
        supabase.from('recurring_incomes').select('*').eq('user_id', userId),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (incomesRes.error) throw incomesRes.error;

      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        transactions: transactionsRes.data,
        recurringExpenses: expensesRes.data,
        recurringIncomes: incomesRes.data,
      };

      return new Response(
        JSON.stringify(backup),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="finprojection-backup-${new Date().toISOString().split('T')[0]}.json"`,
          }
        }
      );
    }

    if (req.method === 'POST') {
      // Import user data (restore from backup)
      const body = await req.json();
      const { transactions, recurringExpenses, recurringIncomes, clearExisting } = body;

      // Optionally clear existing data
      if (clearExisting) {
        await Promise.all([
          supabase.from('transactions').delete().eq('user_id', userId),
          supabase.from('recurring_expenses').delete().eq('user_id', userId),
          supabase.from('recurring_incomes').delete().eq('user_id', userId),
        ]);
      }

      const results = { transactions: 0, expenses: 0, incomes: 0 };

      // Import transactions
      if (transactions && Array.isArray(transactions)) {
        for (const t of transactions) {
          const { error } = await supabase.from('transactions').insert({
            user_id: userId,
            description: t.description,
            category: t.category,
            amount: t.amount,
            date: t.date,
            icon: t.icon || 'creditcard',
          });
          if (!error) results.transactions++;
        }
      }

      // Import recurring expenses
      if (recurringExpenses && Array.isArray(recurringExpenses)) {
        for (const e of recurringExpenses) {
          const { error } = await supabase.from('recurring_expenses').insert({
            user_id: userId,
            name: e.name,
            amount: e.amount,
            icon: e.icon || 'creditcard',
            active: e.active ?? true,
            day: e.day || 1,
          });
          if (!error) results.expenses++;
        }
      }

      // Import recurring incomes
      if (recurringIncomes && Array.isArray(recurringIncomes)) {
        for (const i of recurringIncomes) {
          const { error } = await supabase.from('recurring_incomes').insert({
            user_id: userId,
            name: i.name,
            amount: i.amount,
            icon: i.icon || 'creditcard',
            active: i.active ?? true,
            day: i.day || 1,
          });
          if (!error) results.incomes++;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          imported: results,
          message: `Importati: ${results.transactions} transazioni, ${results.expenses} spese ricorrenti, ${results.incomes} entrate ricorrenti`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[backup-api] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
