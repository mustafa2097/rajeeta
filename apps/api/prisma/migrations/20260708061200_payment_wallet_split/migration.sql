-- Payment method + wallet split

CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ELECTRONIC');
CREATE TYPE "ConsultationPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED');

ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'CASH_CONSULTATION';
ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'ELECTRONIC_CONSULTATION';

ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  ADD COLUMN IF NOT EXISTS "consultationPaymentStatus" "ConsultationPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "appointmentId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_appointmentId_key" ON "Payment"("appointmentId");

DO $$ BEGIN
  ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Recalculate withdrawable balance: legacy CONSULTATION = cash (not withdrawable)
UPDATE "Wallet" w
SET balance = COALESCE((
  SELECT SUM(
    CASE
      WHEN wt.type = 'DISCOUNT_CREDIT' AND wt.amount > 0 THEN wt.amount
      WHEN wt.type = 'WITHDRAWAL' THEN wt.amount
      ELSE 0
    END
  )
  FROM "WalletTransaction" wt
  WHERE wt."walletId" = w.id
), 0);
