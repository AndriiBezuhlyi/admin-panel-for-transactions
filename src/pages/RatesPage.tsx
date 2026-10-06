import { Button } from 'antd'
import { RatesPanel } from '../features/exchange-rates/RatesPanel'
import { useExchangeRates } from '../features/exchange-rates/queries'
export default function RatesPage() {
  const query = useExchangeRates()
  return (
    <section className="page">
      <RatesPanel />
      <Button loading={query.isFetching} onClick={() => void query.refetch()}>
        Оновити курси
      </Button>
    </section>
  )
}
