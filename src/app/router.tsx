import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Result } from 'antd'
import { Layout, RouteError } from './Layout'
export const router = createBrowserRouter([
  {
    element: <Layout />,
    hydrateFallbackElement: <div role="status">Завантаження сторінки…</div>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        lazy: async () => ({
          Component: (await import('../pages/DashboardPage')).default,
        }),
      },
      {
        path: 'transactions',
        lazy: async () => ({
          Component: (await import('../pages/TransactionsPage')).default,
        }),
      },
      {
        path: 'transactions/:id',
        lazy: async () => ({
          Component: (await import('../pages/TransactionPage')).default,
        }),
      },
      {
        path: 'exchange-rates',
        lazy: async () => ({
          Component: (await import('../pages/RatesPage')).default,
        }),
      },
      {
        path: 'converter',
        lazy: async () => ({
          Component: (await import('../pages/ConverterPage')).default,
        }),
      },
      {
        path: '*',
        element: <Result status="404" title="Сторінку не знайдено" />,
      },
    ],
  },
])
