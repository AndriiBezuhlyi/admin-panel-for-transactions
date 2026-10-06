import { useQuery } from '@tanstack/react-query'
import { ApiError, fetchJson, requireKey } from '../../shared/api/client'
import { normalizeTransactions } from './model'

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    staleTime: 60000,
    queryFn: async ({ signal }) => {
      const key = requireKey(import.meta.env.VITE_FINANCE_API_KEY, 'finance')
      const options = { signal, headers: { 'x-api-key': key } }
      const [first, second] = await Promise.all([
        fetchJson(
          'https://cpa-server-vtel.onrender.com/api/finance1',
          'finance1',
          options,
        ),
        fetchJson(
          'https://cpa-server-vtel.onrender.com/api/finance2',
          'finance2',
          options,
        ),
      ])
      try {
        return normalizeTransactions(first, second)
      } catch {
        throw new ApiError(
          'Сервіс повернув некоректні дані транзакцій. Спробуйте пізніше.',
        )
      }
    },
  })
}
