-- Add start_date to recurring items
ALTER TABLE public.recurring_expenses ADD COLUMN start_date DATE NOT NULL DEFAULT '2026-01-01';
ALTER TABLE public.recurring_incomes ADD COLUMN start_date DATE NOT NULL DEFAULT '2026-01-01';
