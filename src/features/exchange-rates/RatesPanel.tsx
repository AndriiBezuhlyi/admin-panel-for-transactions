import { useExchangeRates, popularCurrencies } from './queries'
import { QueryFeedback } from '../../shared/ui/QueryFeedback'
import { Money } from '../../shared/lib/money'
import styles from '../../app/Layout.module.css'

export function RatesPanel() {
  const query = useExchangeRates()
  return (
    <section className={styles.panel} aria-label="Курси валют">
      <h2>Курси валют</h2>
      <p>Вартість 1 USD у світі</p>
      <QueryFeedback loading={query.isPending} error={query.error} />
      {query.data && (
        <>
          <small>Дата сервісу: {query.data.date}</small>
          <ul
            className={styles.scrollList}
            tabIndex={0}
            aria-label="Список курсів"
          >
            {Object.entries(popularCurrencies).map(([currency, name]) => (
              <li key={currency}>
                <strong>{name}</strong>
                <br />1 USD ={' '}
                {query.data.rates[currency]
                  ? new Money(query.data.rates[currency])
                      .toDecimalPlaces(4)
                      .toString()
                  : '—'}{' '}
                {currency}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
