import { WalletTransactionType } from '@prisma/client';

/** Legacy CONSULTATION rows are treated as cash (earnings only). */
const EARNING_TYPES: WalletTransactionType[] = [
  WalletTransactionType.CONSULTATION,
  WalletTransactionType.CASH_CONSULTATION,
  WalletTransactionType.ELECTRONIC_CONSULTATION,
  WalletTransactionType.DISCOUNT_CREDIT,
];

const WITHDRAWABLE_CREDIT_TYPES: WalletTransactionType[] = [
  WalletTransactionType.ELECTRONIC_CONSULTATION,
  WalletTransactionType.DISCOUNT_CREDIT,
];

export function computeWalletSummary(
  transactions: { amount: number; type: WalletTransactionType }[],
) {
  let totalEarnings = 0;
  let withdrawableBalance = 0;

  for (const tx of transactions) {
    if (tx.type === WalletTransactionType.WITHDRAWAL) {
      withdrawableBalance += tx.amount;
      continue;
    }
    if (EARNING_TYPES.includes(tx.type) && tx.amount > 0) {
      totalEarnings += tx.amount;
    }
    if (WITHDRAWABLE_CREDIT_TYPES.includes(tx.type) && tx.amount > 0) {
      withdrawableBalance += tx.amount;
    }
  }

  return { totalEarnings, withdrawableBalance };
}

export function enrichWallet<
  T extends {
    balance: number;
    transactions?: { amount: number; type: WalletTransactionType }[];
  },
>(wallet: T) {
  const summary = computeWalletSummary(wallet.transactions ?? []);
  return {
    ...wallet,
    balance: summary.withdrawableBalance,
    totalEarnings: summary.totalEarnings,
    withdrawableBalance: summary.withdrawableBalance,
  };
}
