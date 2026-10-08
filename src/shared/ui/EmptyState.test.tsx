import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'

it('provides a Ukrainian default message announced as a status', () => {
  render(<EmptyState />)
  expect(screen.getByRole('status')).toHaveTextContent('Даних поки немає')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('supports contextual text and an interactive action', () => {
  const onReset = vi.fn()
  render(
    <EmptyState
      title="Нічого не знайдено"
      description="Спробуйте змінити фільтри."
      action={<button onClick={onReset}>Скинути фільтри</button>}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Нічого не знайдено')
  expect(screen.getByText('Спробуйте змінити фільтри.')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Скинути фільтри' }))
  expect(onReset).toHaveBeenCalledOnce()
})
