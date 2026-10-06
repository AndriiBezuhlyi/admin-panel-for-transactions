import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { QueryFeedback } from './QueryFeedback'
it('показує зрозумілу помилку сервісу', () => {
  render(
    <QueryFeedback
      error={new Error('Не вдалося завантажити дані. Спробуйте пізніше.')}
    />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Не вдалося завантажити дані',
  )
})
