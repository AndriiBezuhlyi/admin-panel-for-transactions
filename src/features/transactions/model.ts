import { z } from 'zod'
import { Money } from '../../shared/lib/money'

const amountSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^[+-]?\d+(\.\d+)?$/.test(value), 'Некоректна сума')
const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/)
const firstSourceSchema = z.object({
  transactions: z.array(
    z.object({
      amount: amountSchema,
      currency: currencySchema,
      type: z.string().nullish(),
      status: z.string().nullish(),
    }),
  ),
})
const secondSourceSchema = z.array(
  z
    .string()
    .trim()
    .transform((value) =>
      z.tuple([amountSchema, currencySchema]).parse(value.split(/\s+/)),
    ),
)

export interface Transaction {
  id: string
  amount: string
  currency: string
  source: 'finance1' | 'finance2'
  status: string | null
  included: boolean
}

export function normalizeTransactions(
  source1: unknown,
  source2: unknown,
): Transaction[] {
  const first = firstSourceSchema
    .parse(source1)
    .transactions.map((item, index): Transaction => {
      const status = item.status ?? item.type ?? null
      // API поки не повертає ID: індекс придатний лише для поточного набору даних.
      return {
        id: `finance1-${index}`,
        amount: item.amount,
        currency: item.currency,
        source: 'finance1',
        status,
        included: status === null || status === 'paid',
      }
    })
  const second = secondSourceSchema
    .parse(source2)
    .map(([amount, currency], index): Transaction => ({
      id: `finance2-${index}`,
      amount,
      currency,
      source: 'finance2',
      status: null,
      included: true,
    }))
  console.info('[Успіх] Транзакції підготовлено', {
    total: first.length + second.length,
  })
  return [...first, ...second]
}

export function calculateCurrencyTotals(transactions: Transaction[]) {
  const totals = { USD: new Money(0), EUR: new Money(0) }
  for (const item of transactions) {
    if (item.included && (item.currency === 'USD' || item.currency === 'EUR')) {
      totals[item.currency] = totals[item.currency].plus(item.amount)
    }
  }
  return { USD: totals.USD.toFixed(2), EUR: totals.EUR.toFixed(2) }
}

export function convertAmount(
  amount: string,
  from: string,
  to: string,
  rates: Record<string, string>,
) {
  if (from === to) return new Money(amount).toFixed(2)
  const rate = (currency: string) => {
    const value = currency === 'USD' ? '1' : rates[currency]
    if (!value || !new Money(value).isFinite() || new Money(value).lte(0))
      throw new Error(`Немає курсу ${currency}`)
    return new Money(value)
  }
  return new Money(amount).div(rate(from)).times(rate(to)).toFixed(2)
}

export function calculateDailyRevenue(
  transactions: Transaction[],
  rates: Record<string, string>,
) {
  let total = new Money(0)
  for (const item of transactions.filter((item) => item.included)) {
    if (item.currency === 'USD') {
      total = total.plus(item.amount)
      continue
    }
    const value = rates[item.currency]
    if (!value || !new Money(value).isFinite() || new Money(value).lte(0))
      throw new Error(`Немає курсу ${item.currency}`)
    // Не округлюємо окремі конвертації: це звітний еквівалент, а не проведення операцій.
    total = total.plus(new Money(item.amount).div(value))
  }
  return { total: total.toFixed(2), currency: 'USD' as const }
}
