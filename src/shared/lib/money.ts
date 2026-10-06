import Decimal from 'decimal.js'

// Єдина точність і правило округлення для всіх попередніх фінансових розрахунків.
export const Money = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
})
export function formatMoney(amount: string, currency: string) {
  const [whole, fraction] = new Money(amount).toFixed(2).split('.')
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')},${fraction} ${currency}`
}
