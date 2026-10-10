import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { ApiError, fetchJson, requireKey } from '../../shared/api/client'
import { Money } from '../../shared/lib/money'

export const exchangeRatesEndpoint =
  'https://api.currencyfreaks.com/v2.0/rates/latest'

const schema = z.object({
  base: z.literal('USD'),
  date: z.string(),
  rates: z.record(
    z.string(),
    z.string().refine((value) => {
      try {
        return new Money(value).isFinite() && new Money(value).gt(0)
      } catch {
        return false
      }
    }),
  ),
})
export const popularCurrencies: Record<string, string> = {
  EUR: 'Євро',
  GBP: 'Британський фунт',
  JPY: 'Японська єна',
  CHF: 'Швейцарський франк',
  CAD: 'Канадський долар',
  AUD: 'Австралійський долар',
  CNY: 'Китайський юань',
}
export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    staleTime: 15 * 60000,
    queryFn: async ({ signal }) => {
      const key = requireKey(
        import.meta.env.VITE_CURRENCYFREAKS_API_KEY,
        'CurrencyFreaks',
      )
      const url = new URL(exchangeRatesEndpoint)
      url.searchParams.set('apikey', key)
      const response = await fetchJson(url, 'CurrencyFreaks', { signal })
      const result = schema.safeParse(response)
      if (!result.success)
        throw new ApiError(
          'Не вдалося отримати коректні курси валют. Спробуйте пізніше.',
        )
      const rates: Record<string, string> = { ...result.data.rates, USD: '1' }
      return { date: result.data.date, rates }
    },
  })
}
