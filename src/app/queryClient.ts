import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../shared/api/client'
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Не повторюємо помилки авторизації та некоректні відповіді.
      retry: (count, error) =>
        count < 1 &&
        error instanceof ApiError &&
        error.status !== undefined &&
        error.status >= 500,
    },
  },
})
