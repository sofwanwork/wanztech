-- Fasa D: harden the BCL payment flow.
--
-- 1) Webhook idempotency: a replayed/duplicated BCL webhook previously
--    re-extended the subscription (+1 free month) and re-sent receipt +
--    welcome emails. processed_at marks a completed transaction as fully
--    processed; the webhook short-circuits on it.
-- 2) Order number collisions: `KLIK-${Date.now()}-${random 0-999}` collides
--    under load. A unique index on provider_reference + randomUUID-based
--    order numbers make collisions impossible.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Existing completed transactions are considered processed (prevents the
-- first post-migration replay from double-processing old payments).
UPDATE public.transactions
  SET processed_at = now()
  WHERE status = 'completed' AND processed_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_provider_reference_idx
  ON public.transactions (provider_reference)
  WHERE provider_reference IS NOT NULL;

NOTIFY pgrst, 'reload schema';
