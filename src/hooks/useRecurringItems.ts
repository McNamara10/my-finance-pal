import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  icon: string;
  active: boolean;
  day: number;
  start_date: string;
}

export const useRecurringExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('day', { ascending: true });

      if (error) throw error;

      setExpenses(
        data.map((e: any) => ({
          id: e.id,
          name: e.name,
          amount: Number(e.amount),
          icon: e.icon,
          active: e.active,
          day: e.day,
          start_date: e.start_date,
        }))
      );
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Errore nel caricamento delle spese');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const addExpense = async (expense: Omit<RecurringItem, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert({
          user_id: user.id,
          name: expense.name,
          amount: expense.amount,
          icon: expense.icon,
          active: expense.active,
          day: expense.day,
          start_date: expense.start_date,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setExpenses((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          amount: Number(data.amount),
          icon: data.icon,
          active: data.active,
          day: data.day,
          start_date: data.start_date,
        },
      ]);
      toast.success('Spesa aggiunta');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error("Errore nell'aggiunta della spesa");
    }
  };

  const updateExpense = async (id: string, updates: Partial<RecurringItem>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );
      toast.success('Spesa aggiornata');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error("Errore nell'aggiornamento della spesa");
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success('Spesa eliminata');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error("Errore nell'eliminazione della spesa");
    }
  };

  const toggleExpense = async (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (expense) {
      await updateExpense(id, { active: !expense.active });
    }
  };

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleExpense,
    refetch: fetchExpenses,
  };
};

export const useRecurringIncomes = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncomes = async () => {
    if (!user) {
      setIncomes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recurring_incomes')
        .select('*')
        .order('day', { ascending: true });

      if (error) throw error;

      setIncomes(
        data.map((i: any) => ({
          id: i.id,
          name: i.name,
          amount: Number(i.amount),
          icon: i.icon,
          active: i.active,
          day: i.day,
          start_date: i.start_date,
        }))
      );
    } catch (error) {
      console.error('Error fetching incomes:', error);
      toast.error('Errore nel caricamento delle entrate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [user]);

  const addIncome = async (income: Omit<RecurringItem, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recurring_incomes')
        .insert({
          user_id: user.id,
          name: income.name,
          amount: income.amount,
          icon: income.icon,
          active: income.active,
          day: income.day,
          start_date: income.start_date,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setIncomes((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          amount: Number(data.amount),
          icon: data.icon,
          active: data.active,
          day: data.day,
          start_date: data.start_date,
        },
      ]);
      toast.success('Entrata aggiunta');
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error("Errore nell'aggiunta dell'entrata");
    }
  };

  const updateIncome = async (id: string, updates: Partial<RecurringItem>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recurring_incomes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setIncomes((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
      );
      toast.success('Entrata aggiornata');
    } catch (error) {
      console.error('Error updating income:', error);
      toast.error("Errore nell'aggiornamento dell'entrata");
    }
  };

  const deleteIncome = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recurring_incomes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIncomes((prev) => prev.filter((i) => i.id !== id));
      toast.success('Entrata eliminata');
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error("Errore nell'eliminazione dell'entrata");
    }
  };

  const toggleIncome = async (id: string) => {
    const income = incomes.find((i) => i.id === id);
    if (income) {
      await updateIncome(id, { active: !income.active });
    }
  };

  return {
    incomes,
    loading,
    addIncome,
    updateIncome,
    deleteIncome,
    toggleIncome,
    refetch: fetchIncomes,
  };
};
