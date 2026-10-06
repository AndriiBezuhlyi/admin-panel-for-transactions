import { ConfigProvider } from 'antd'
import ukUA from 'antd/locale/uk_UA'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from './app/queryClient'
import { router } from './app/router'

export default function App() {
  return (
    <ConfigProvider
      locale={ukUA}
      theme={{
        token: {
          colorPrimary: '#5655cf',
          borderRadius: 9,
          fontFamily: "'Segoe UI Variable Text', 'Segoe UI', Arial, sans-serif",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ConfigProvider>
  )
}
