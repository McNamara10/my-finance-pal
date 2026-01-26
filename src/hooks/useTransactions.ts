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

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transactions-api`;

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? `Bearer ${session.access_token}` : '';
  };

  const fetchTransactions = async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel caricamento');
      }

      const { transactions: data } = await response.json();

      setTransactions(
        data.map((t: any) => ({
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
      const authHeader = await getAuthHeader();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nell\'aggiunta');
      }

      const { transaction: data } = await response.json();

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
      const authHeader = await getAuthHeader();
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nell\'aggiornamento');
      }

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
      const authHeader = await getAuthHeader();
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nell\'eliminazione');
      }

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
