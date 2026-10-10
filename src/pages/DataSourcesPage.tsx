import { Alert, Button, Tag } from 'antd'
import {
  financeEndpoints,
  useTransactions,
} from '../features/transactions/queries'
import {
  exchangeRatesEndpoint,
  useExchangeRates,
} from '../features/exchange-rates/queries'
import styles from './DataSourcesPage.module.css'

interface SourceStatusProps {
  pending: boolean
  fetching: boolean
  failed: boolean
  cached: boolean
}

function SourceStatus({
  pending,
  fetching,
  failed,
  cached,
}: SourceStatusProps) {
  if (failed)
    return (
      <Tag color="orange">
        {cached ? 'Збережені дані · оновлення не вдалося' : 'Дані недоступні'}
      </Tag>
    )
  if (fetching || pending)
    return (
      <Tag color="processing">
        {cached ? 'Оновлення даних' : 'Завантаження'}
      </Tag>
    )
  return <Tag color="green">Дані завантажено</Tag>
}

const loadedAt = (timestamp: number) =>
  timestamp ? new Date(timestamp).toLocaleString('uk-UA') : 'Ще не завантажено'

export default function DataSourcesPage() {
  const transactions = useTransactions()
  const rates = useExchangeRates()
  const financeStatus = {
    pending: transactions.isPending,
    fetching: transactions.isFetching,
    failed: transactions.isError,
    cached: transactions.data !== undefined,
  }
  const rateStatus = {
    pending: rates.isPending,
    fetching: rates.isFetching,
    failed: rates.isError,
    cached: rates.data !== undefined,
  }

  return (
    <section className="page">
      <div className={styles.heading}>
        <div>
          <h1>Джерела даних</h1>
          <p>
            Звідки надходять транзакції та курси для фінансових розрахунків.
          </p>
        </div>
        <Button
          type="primary"
          loading={transactions.isFetching || rates.isFetching}
          onClick={() => {
            void transactions.refetch()
            void rates.refetch()
          }}
        >
          Оновити джерела
        </Button>
      </div>
      <p>
        Обидва фінансові джерела завантажуються разом. Їхній статус нижче
        спільний: збій одного запиту не означає, що обидва сервіси недоступні.
      </p>
      {transactions.isError && (
        <Alert
          type="error"
          showIcon
          title="Спільне завантаження транзакцій не вдалося"
          description="Не вдалося отримати або перевірити повний набір транзакцій. Спробуйте оновити джерела пізніше."
        />
      )}
      <div className={styles.sources}>
        {(['finance1', 'finance2'] as const).map((source) => {
          const rows = transactions.data?.filter(
            (item) => item.source === source,
          )
          const missingCurrencies =
            rates.data && rows
              ? [
                  ...new Set(
                    rows
                      .filter(
                        (item) =>
                          item.included &&
                          !Object.hasOwn(rates.data.rates, item.currency),
                      )
                      .map((item) => item.currency),
                  ),
                ].sort()
              : []
          return (
            <section key={source} className={styles.source} aria-label={source}>
              <div className={styles.sourceHeading}>
                <h2>{source === 'finance1' ? 'Finance 1' : 'Finance 2'}</h2>
                <SourceStatus {...financeStatus} />
              </div>
              <a
                className={styles.endpoint}
                href={financeEndpoints[source]}
                target="_blank"
                rel="noopener noreferrer"
              >
                {financeEndpoints[source]}
              </a>
              <p>
                {source === 'finance1'
                  ? 'Суми, валюти та статуси транзакцій. До підсумку входять оплачені транзакції або транзакції без статусу.'
                  : 'Транзакції у форматі сума + валюта. Усі записи враховуються у підсумку.'}
              </p>
              <dl className={styles.details}>
                <dt>Записів у завантажених даних</dt>
                <dd>{rows?.length ?? 'Недоступно'}</dd>
                <dt>Враховано в розрахунках</dt>
                <dd>
                  {rows?.filter((item) => item.included).length ?? 'Недоступно'}
                </dd>
                <dt>Останнє успішне завантаження</dt>
                <dd>{loadedAt(transactions.dataUpdatedAt)}</dd>
              </dl>
              <h3>Потенційні проблеми</h3>
              <p>
                Відоме обмеження: немає стабільних ID та дат транзакцій. Це
                ускладнює звірку й історичні розрахунки.
              </p>
              {source === 'finance2' && (
                <Alert
                  type="warning"
                  showIcon
                  title="За попереднім аудитом — різний регістр валют"
                  description="Аудит від 10.10.2026 зафіксував 9 кодів валют у нижньому регістрі. Застосунок їх нормалізує; це історичний висновок, а не нова перевірка сирих даних."
                />
              )}
              {missingCurrencies.length > 0 && (
                <Alert
                  type="error"
                  showIcon
                  title="Немає курсів для врахованих валют"
                  description={missingCurrencies.join(', ')}
                />
              )}
              {!rates.data && (
                <p>Перевірка підтримки валют очікує завантаження курсів.</p>
              )}
            </section>
          )
        })}
        <section className={styles.source} aria-label="CurrencyFreaks">
          <div className={styles.sourceHeading}>
            <h2>CurrencyFreaks</h2>
            <SourceStatus {...rateStatus} />
          </div>
          <a
            className={styles.endpoint}
            href="https://currencyfreaks.com/documentation"
            target="_blank"
            rel="noopener noreferrer"
          >
            {exchangeRatesEndpoint}
          </a>
          <p>
            Курси відносно USD для загальної суми та калькулятора. Загальний
            підсумок зводиться до USD.
          </p>
          <dl className={styles.details}>
            <dt>Доступних курсів</dt>
            <dd>
              {rates.data ? Object.keys(rates.data.rates).length : 'Недоступно'}
            </dd>
            <dt>Дата курсів сервісу</dt>
            <dd>{rates.data?.date ?? 'Недоступно'}</dd>
            <dt>Останнє успішне завантаження</dt>
            <dd>{loadedAt(rates.dataUpdatedAt)}</dd>
          </dl>
          <h3>Потенційні проблеми</h3>
          <p>
            Це останні доступні курси сервісу, а не історичні курси на дату
            транзакції. Перевіряйте дату перед бухгалтерською звіркою.
          </p>
          {rates.isError && (
            <Alert
              type="error"
              showIcon
              title="Курси не вдалося завантажити або перевірити"
              description="Конвертація потребує коректних курсів. Уже завантажені транзакції залишаються доступними."
            />
          )}
        </section>
      </div>
      <p>
        Оновлення перевіряє поточні відповіді API, але не замінює повний аудит
        сирих даних. Висновки попереднього аудиту та відомі обмеження позначені
        окремо.
      </p>
    </section>
  )
}
