import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import DataSourcesPage from './DataSourcesPage'

const queries = vi.hoisted(() => ({ transactions: vi.fn(), rates: vi.fn() }))
vi.mock('../features/transactions/queries', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../features/transactions/queries')
  >()),
  useTransactions: queries.transactions,
}))
vi.mock('../features/exchange-rates/queries', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../features/exchange-rates/queries')
  >()),
  useExchangeRates: queries.rates,
}))

const refreshFinance = vi.fn()
const refreshRates = vi.fn()
const finance = {
  data: [
    {
      id: '1',
      source: 'finance1',
      amount: '100',
      currency: 'USD',
      status: 'paid',
      included: true,
    },
  ],
  isPending: false,
  isFetching: false,
  isError: false,
  dataUpdatedAt: 1,
  refetch: refreshFinance,
}
const rates = {
  data: { rates: { USD: '1', EUR: '0.8' }, date: '2026-10-10' },
  isPending: false,
  isFetching: false,
  isError: false,
  dataUpdatedAt: 1,
  refetch: refreshRates,
}

beforeEach(() => {
  vi.clearAllMocks()
  queries.transactions.mockReturnValue(finance)
  queries.rates.mockReturnValue(rates)
})

it('shows safe source URLs, clearly historical findings, and refreshes existing queries', () => {
  render(<DataSourcesPage />)
  expect(screen.getByRole('heading', { name: 'Джерела даних' })).toBeVisible()
  expect(
    within(screen.getByLabelText('finance2')).getByText(/історичний висновок/),
  ).toBeVisible()
  expect(
    screen
      .getByRole('link', { name: /api.currencyfreaks.com/ })
      .getAttribute('href'),
  ).not.toContain('apikey')
  fireEvent.click(screen.getByRole('button', { name: 'Оновити джерела' }))
  expect(refreshFinance).toHaveBeenCalledOnce()
  expect(refreshRates).toHaveBeenCalledOnce()
})

it('does not attribute a shared finance failure to one provider or invent a zero count', () => {
  queries.transactions.mockReturnValue({
    ...finance,
    data: undefined,
    isError: true,
    dataUpdatedAt: 0,
  })
  render(<DataSourcesPage />)
  expect(
    screen.getByText('Спільне завантаження транзакцій не вдалося'),
  ).toBeVisible()
  expect(
    within(screen.getByLabelText('finance1')).getAllByText('Недоступно'),
  ).toHaveLength(2)
  expect(
    within(screen.getByLabelText('CurrencyFreaks')).getByText(
      'Дані завантажено',
    ),
  ).toBeVisible()
})

it('marks cached data on failed refresh and checks only included currency coverage', () => {
  queries.transactions.mockReturnValue({
    ...finance,
    isError: true,
    data: [
      ...finance.data,
      {
        id: '2',
        source: 'finance2',
        amount: '100',
        currency: 'XYZ',
        status: null,
        included: true,
      },
      {
        id: '3',
        source: 'finance2',
        amount: '100',
        currency: 'GBP',
        status: 'pending',
        included: false,
      },
    ],
  })
  render(<DataSourcesPage />)
  const second = within(screen.getByLabelText('finance2'))
  expect(
    second.getByText('Збережені дані · оновлення не вдалося'),
  ).toBeVisible()
  expect(second.getByText('XYZ')).toBeVisible()
  expect(second.queryByText('GBP')).not.toBeInTheDocument()
})
