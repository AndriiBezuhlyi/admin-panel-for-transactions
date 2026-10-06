import { Link } from 'react-router-dom'
import { useTransactions } from './queries'
import { QueryFeedback } from '../../shared/ui/QueryFeedback'
import { formatMoney } from '../../shared/lib/money'
import styles from '../../app/Layout.module.css'

export function TransactionsPanel() {
  const query = useTransactions()
  return (
    <section className={styles.panel} aria-label="Усі транзакції">
      <h2>Усі транзакції</h2>
      <QueryFeedback loading={query.isPending} error={query.error} />
      {query.data && (
        <>
          <p>
            Усього: {query.data.length}. Враховано:{' '}
            {query.data.filter((item) => item.included).length}.
          </p>
          <ul
            className={styles.scrollList}
            tabIndex={0}
            aria-label="Список транзакцій"
          >
            {query.data.map((item) => (
              <li key={item.id}>
                <Link to={`/transactions/${item.id}`}>
                  {formatMoney(item.amount, item.currency)}
                </Link>
                <br />
                <small>
                  {item.source} · {item.status ?? 'без статусу'} ·{' '}
                  {item.included ? 'враховано' : 'не враховано'}
                </small>
              </li>
            ))}
            {!query.data.length && <li>Транзакцій немає.</li>}
          </ul>
        </>
      )}
    </section>
  )
}
