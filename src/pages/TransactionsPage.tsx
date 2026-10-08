import { Input, Select, Table, Tag, Button } from 'antd'
import type { TableProps } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { useTransactions } from '../features/transactions/queries'
import type { Transaction } from '../features/transactions/model'
import { Money, formatMoney } from '../shared/lib/money'
import { QueryFeedback } from '../shared/ui/QueryFeedback'
import { EmptyState } from '../shared/ui/EmptyState'

export default function TransactionsPage() {
  const query = useTransactions()
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const status = params.get('status') ?? 'all'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    next.delete('page')
    setParams(next, { replace: true })
  }
  const columns: TableProps<Transaction>['columns'] = [
    {
      title: 'Транзакція',
      dataIndex: 'id',
      render: (id: string) => <Link to={`/transactions/${id}`}>{id}</Link>,
    },
    {
      title: 'Сума',
      render: (_, item) => formatMoney(item.amount, item.currency),
      sorter: (a, b) => new Money(a.amount).cmp(b.amount),
    },
    { title: 'Валюта', dataIndex: 'currency' },
    { title: 'Джерело', dataIndex: 'source' },
    {
      title: 'Статус',
      render: (_, item) => (
        <Tag color={item.included ? 'green' : 'default'}>
          {item.status ?? 'без статусу'}
        </Tag>
      ),
    },
  ]
  const items = (query.data ?? []).filter(
    (item) =>
      `${item.id} ${item.amount} ${item.currency} ${item.source}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'all' ||
        (status === 'included' ? item.included : !item.included)),
  )
  return (
    <section className="page">
      <h1>Транзакції</h1>
      <div className="toolbar">
        <Input
          aria-label="Пошук транзакцій"
          placeholder="Пошук за сумою, валютою або джерелом"
          value={search}
          onChange={(event) => setFilter('search', event.target.value)}
          allowClear
        />
        <Select
          aria-label="Фільтр транзакцій"
          value={status}
          onChange={(value) => setFilter('status', value)}
          options={[
            { value: 'all', label: 'Усі' },
            { value: 'included', label: 'Враховані' },
            { value: 'excluded', label: 'Не враховані' },
          ]}
        />
        <Button loading={query.isFetching} onClick={() => void query.refetch()}>
          Оновити
        </Button>
      </div>
      <QueryFeedback error={query.error} />
      <p>
        Сортування суми порівнює початкові числові значення у різних валютах.
      </p>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={query.isPending}
        locale={{
          emptyText:
            query.isPending || query.error ? null : (
              <EmptyState
                title={
                  query.data?.length
                    ? 'Нічого не знайдено'
                    : 'Транзакцій поки немає'
                }
                description={
                  query.data?.length
                    ? 'Спробуйте змінити пошук або фільтри.'
                    : 'Оновіть дані або поверніться пізніше.'
                }
              />
            ),
        }}
        scroll={{ x: 650 }}
        pagination={{
          current: Math.min(page, Math.max(1, Math.ceil(items.length / 10))),
          pageSize: 10,
          showSizeChanger: false,
          onChange: (value) => {
            const next = new URLSearchParams(params)
            next.set('page', String(value))
            setParams(next)
          },
        }}
      />
    </section>
  )
}
