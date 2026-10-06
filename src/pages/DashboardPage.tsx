import { Button, Alert } from 'antd'
import { useEffect } from 'react'
import { useTransactions } from '../features/transactions/queries'
import { useExchangeRates } from '../features/exchange-rates/queries'
import { RatesPanel } from '../features/exchange-rates/RatesPanel'
import { TransactionsPanel } from '../features/transactions/TransactionsPanel'
import {
  calculateCurrencyTotals,
  calculateDailyRevenue,
} from '../features/transactions/model'
import { formatMoney } from '../shared/lib/money'
import { QueryFeedback } from '../shared/ui/QueryFeedback'
import styles from '../app/Layout.module.css'

export default function DashboardPage() {
  const transactions = useTransactions()
  const rates = useExchangeRates()
  const totals = transactions.data
    ? calculateCurrencyTotals(transactions.data)
    : null
  const needsRates = transactions.data?.some(
    (item) => item.included && item.currency !== 'USD',
  )
  let total: string | null = null
  let conversionFailed = false
  if (transactions.data && (!needsRates || rates.data)) {
    try {
      total = calculateDailyRevenue(
        transactions.data,
        rates.data?.rates ?? {},
      ).total
    } catch {
      conversionFailed = true
    }
  }
  useEffect(() => {
    if (total !== null)
      console.info('[Успіх] Загальна сума розрахована в USD', total)
    if (conversionFailed)
      console.error('[Невдача] Відсутній або некоректний курс для конвертації')
  }, [total, conversionFailed])
  return (
    <div className={styles.dashboard}>
      <RatesPanel />
      <section
        className={`${styles.panel} ${styles.summary}`}
        aria-label="Загальна сума"
      >
        <h1>Сума транзакцій</h1>
        <QueryFeedback
          loading={transactions.isPending || (needsRates && rates.isPending)}
          error={transactions.error}
        />
        {needsRates && rates.error && (
          <Alert
            type="warning"
            showIcon
            title="Курси зараз недоступні. Загальну суму не вдалося оновити."
          />
        )}
        {conversionFailed && (
          <Alert
            type="error"
            title="Для деяких валют немає курсу. Загальну суму не вдалося розрахувати."
          />
        )}
        {total !== null && (
          <strong className={styles.total}>{formatMoney(total, 'USD')}</strong>
        )}
        {transactions.data && (
          <p>
            Враховано транзакцій:{' '}
            {transactions.data.filter((item) => item.included).length}
          </p>
        )}
        {totals && (
          <section className={styles.currencyTotals}>
            <h2>Суми за валютами</h2>
            <p>Враховані транзакції до конвертації</p>
            <strong>{formatMoney(totals.USD, 'USD')}</strong>
            <strong>{formatMoney(totals.EUR, 'EUR')}</strong>
          </section>
        )}
        <Button
          type="primary"
          loading={transactions.isFetching || rates.isFetching}
          onClick={() => {
            console.info('[Початок] Оновлення транзакцій і курсів')
            void transactions.refetch()
            void rates.refetch()
          }}
        >
          Оновити
        </Button>
        {transactions.dataUpdatedAt > 0 && (
          <small>
            Завантажено:{' '}
            {new Date(transactions.dataUpdatedAt).toLocaleTimeString('uk-UA')}
          </small>
        )}
      </section>
      <TransactionsPanel />
    </div>
  )
}
