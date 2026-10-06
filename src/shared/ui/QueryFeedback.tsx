import { Alert, Spin } from 'antd'

export function QueryFeedback({
  loading,
  error,
}: {
  loading?: boolean
  error?: Error | null
}) {
  if (error)
    return <Alert role="alert" type="error" showIcon title={error.message} />
  if (loading)
    return (
      <div role="status">
        <Spin size="small" /> Завантаження даних…
      </div>
    )
  return null
}
