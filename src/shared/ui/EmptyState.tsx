import type { ReactNode } from 'react'
import { Empty, Typography } from 'antd'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  title = 'Даних поки немає',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div role="status">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <>
            <Typography.Text strong>{title}</Typography.Text>
            {description && <div>{description}</div>}
          </>
        }
      >
        {action}
      </Empty>
    </div>
  )
}
