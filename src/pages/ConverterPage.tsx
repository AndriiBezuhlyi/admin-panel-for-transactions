import { useState } from 'react'
import { Alert, Button, Form, Input, Select } from 'antd'
import { useExchangeRates } from '../features/exchange-rates/queries'
import { convertAmount } from '../features/transactions/model'
import { formatMoney } from '../shared/lib/money'
import { QueryFeedback } from '../shared/ui/QueryFeedback'

interface Values {
  amount: string
  from: string
  to: string
}
export default function ConverterPage() {
  const query = useExchangeRates()
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const options = Object.keys(query.data?.rates ?? { USD: '1', EUR: '1' })
    .filter((code) => /^[A-Z]{3}$/.test(code))
    .sort()
    .map((value) => ({ value, label: value }))
  return (
    <section className="page">
      <h1>Конвертер валют</h1>
      <QueryFeedback loading={query.isPending} error={query.error} />
      <Form<Values>
        layout="vertical"
        initialValues={{ amount: '100', from: 'USD', to: 'EUR' }}
        onValuesChange={() => {
          setResult(null)
          setError(null)
        }}
        onFinish={(values) => {
          try {
            if (!query.data) return
            setResult(
              formatMoney(
                convertAmount(
                  values.amount.replace(',', '.'),
                  values.from,
                  values.to,
                  query.data.rates,
                ),
                values.to,
              ),
            )
            setError(null)
          } catch {
            setResult(null)
            setError(
              'Не вдалося конвертувати суму. Перевірте значення та доступність курсів.',
            )
          }
        }}
      >
        <Form.Item
          name="amount"
          label="Сума"
          rules={[
            { required: true, message: 'Введіть суму' },
            { pattern: /^\d+([.,]\d+)?$/, message: 'Введіть невід’ємне число' },
          ]}
        >
          <Input inputMode="decimal" />
        </Form.Item>
        <Form.Item name="from" label="З валюти">
          <Select showSearch options={options} />
        </Form.Item>
        <Form.Item name="to" label="У валюту">
          <Select showSearch options={options} />
        </Form.Item>
        <Button type="primary" htmlType="submit" disabled={!query.data}>
          Конвертувати
        </Button>
      </Form>
      {result && <h2 role="status">{result}</h2>}
      {error && <Alert type="error" title={error} />}
      {query.data && (
        <small>
          Дата курсів: {query.data.date}. Результат є попереднім розрахунком.
        </small>
      )}
    </section>
  )
}
