import { Descriptions, Result, Button } from 'antd'
import { Link, useParams } from 'react-router-dom'
import { useTransactions } from '../features/transactions/queries'
import { QueryFeedback } from '../shared/ui/QueryFeedback'
import { formatMoney } from '../shared/lib/money'

export default function TransactionPage() {
  const { id } = useParams()
  const query = useTransactions()
  const item = query.data?.find((transaction) => transaction.id === id)
  if (query.isPending || query.error)
    return (
      <section className="page">
        <QueryFeedback loading={query.isPending} error={query.error} />
      </section>
    )
  if (!item)
    return (
      <Result
        status="404"
        title="Транзакцію не знайдено"
        extra={
          <Link to="/transactions">
            <Button>До списку</Button>
          </Link>
        }
      />
    )
  return (
    <section className="page">
      <h1>Деталі транзакції</h1>
      <Descriptions
        bordered
        column={1}
        items={[
          { key: 'id', label: 'Транзакція', children: item.id },
          {
            key: 'amount',
            label: 'Сума',
            children: formatMoney(item.amount, item.currency),
          },
          { key: 'source', label: 'Джерело', children: item.source },
          {
            key: 'status',
            label: 'Статус',
            children: item.status ?? 'без статусу',
          },
          {
            key: 'included',
            label: 'У підсумку',
            children: item.included ? 'Враховано' : 'Не враховано',
          },
        ]}
      />
      <p>
        <Link to="/transactions">Повернутися до списку</Link>
      </p>
    </section>
  )
}
