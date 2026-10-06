export class ApiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function fetchJson(
  url: string | URL,
  label: string,
  options: RequestInit = {},
): Promise<unknown> {
  console.info(`[Запит] ${label}`)
  try {
    const signals = [AbortSignal.timeout(60000)]
    if (options.signal) signals.push(options.signal)
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.any(signals),
    })
    if (!response.ok)
      throw new ApiError(
        'Помилка завантаження даних з боку сервісу. Спробуйте пізніше.',
        response.status,
      )
    const data: unknown = await response.json()
    console.info(`[Успіх] ${label}`)
    return data
  } catch (error) {
    // Скасування запиту при зміні маршруту або StrictMode — очікувана поведінка.
    if (options.signal?.aborted) throw error
    // Не логуємо URL, заголовки або сирі помилки fetch: вони можуть містити ключі.
    console.error(
      `[Невдача] ${label}`,
      error instanceof ApiError ? error.status : 'Мережа або формат відповіді',
    )
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'Не вдалося завантажити дані. Перевірте з’єднання та спробуйте ще раз.',
    )
  }
}

export function requireKey(value: string | undefined, service: string): string {
  if (!value) {
    console.error(`[Невдача] Не налаштований ключ сервісу ${service}`)
    throw new ApiError(
      'Сервіс ще не налаштовано. Зверніться до адміністратора.',
    )
  }
  return value
}
