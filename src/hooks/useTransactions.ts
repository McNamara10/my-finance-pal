import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
}

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setTransactions(
        data.map((t) => ({
          id: t.id,
          description: t.description,
          category: t.category,
          amount: Number(t.amount),
          date: t.date,
          icon: t.icon,
        }))
      );
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Errore nel caricamento delle transazioni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          description: transaction.description,
          category: transaction.category,
          amount: transaction.amount,
          date: transaction.date,
          icon: transaction.icon,
        })
        .select()
        .single();

      if (error) throw error;

      setTransactions((prev) => [
        {
          id: data.id,
          description: data.description,
          category: data.category,
          amount: Number(data.amount),
          date: data.date,
          icon: data.icon,
        },
        ...prev,
      ]);
      toast.success('Transazione aggiunta');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Errore nell\'aggiunta della transazione');
    }
  };

  const updateTransaction = async (id: string, updates: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: updates.description,
          category: updates.category,
          amount: updates.amount,
          date: updates.date,
          icon: updates.icon,
        })
        .eq('id', id);

      if (error) throw error;

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { id, ...updates } : t))
      );
      toast.success('Transazione aggiornata');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Errore nell\'aggiornamento della transazione');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success('Transazione eliminata');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Errore nell\'eliminazione della transazione');
    }
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
};
