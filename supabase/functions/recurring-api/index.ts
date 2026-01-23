import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const url = new URL(req.url);
    const method = req.method;
    const type = url.searchParams.get('type') || 'expense'; // 'expense' or 'income'

    const tableName = type === 'income' ? 'recurring_incomes' : 'recurring_expenses';

    console.log(`[recurring-api] ${method} request for ${type} from user ${userId}`);

    // GET - Fetch all recurring items for user
    if (method === 'GET') {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order('day', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ items: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create new recurring item
    if (method === 'POST') {
      const body = await req.json();
      const { name, amount, icon, active, day } = body;

      if (!name || amount === undefined) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert({
          user_id: userId,
          name,
          amount,
          icon: icon || 'creditcard',
          active: active ?? true,
          day: day || 1,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ item: data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update recurring item
    if (method === 'PUT') {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Item ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ item: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete recurring item
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Item ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[recurring-api] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
