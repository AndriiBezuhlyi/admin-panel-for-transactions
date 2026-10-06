import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/finance1', route => route.fulfill({ json: { transactions: [
    { type: 'paid', amount: 100, currency: 'USD' },
    { type: 'pending', amount: 999, currency: 'EUR' },
  ] } }))
  await page.route('**/api/finance2', route => route.fulfill({ json: ['80 eur', '0.1 USD', '0.2 USD'] }))
  await page.route('**/v2.0/rates/latest?*', route => route.fulfill({ json: {
    base: 'USD', date: '2026-10-06 00:00:00+00', rates: { EUR: '0.8', GBP: '0.5' },
  } }))
})

test('огляд, маршрути, фільтри та деталі працюють зі спільними даними', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByLabel('Загальна сума')).toContainText('200,30 USD')
  await expect(page.getByLabel('Загальна сума')).toContainText('80,00 EUR')
  await expect(page.getByLabel('Усі транзакції')).toContainText('не враховано')
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
  await page.getByRole('link', { name: 'Транзакції', exact: true }).click()
  await page.getByRole('textbox', { name: 'Пошук транзакцій' }).fill('80')
  await expect(page).toHaveURL(/search=80/)
  await page.getByRole('link', { name: 'finance2-0', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Деталі транзакції' })).toBeVisible()
  await expect(page.getByText('80,00 EUR', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('80,00 EUR', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Конвертер', exact: true }).click()
  await page.getByRole('button', { name: 'Конвертувати' }).click()
  await expect(page.getByRole('status')).toContainText('80,00 EUR')
})

test('збій курсів не приховує список і початкові суми', async ({ page }) => {
  await page.route('**/v2.0/rates/latest?*', route => route.fulfill({ status: 401, json: {} }))
  await page.goto('/dashboard')
  await expect(page.getByLabel('Усі транзакції')).toContainText('100,00 USD')
  await expect(page.getByLabel('Загальна сума')).toContainText('80,00 EUR')
  await expect(page.getByLabel('Загальна сума')).toContainText('Курси зараз недоступні')
  await expect(page.locator('body')).not.toContainText('401')
})

test('малий екран має доступні панелі без загальної прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard')
  await expect(page.getByLabel('Загальна сума')).toContainText('200,30 USD')
  expect(await page.evaluate(() => ({
    vertical: document.documentElement.scrollHeight <= window.innerHeight,
    horizontal: document.documentElement.scrollWidth <= window.innerWidth,
  }))).toEqual({ vertical: true, horizontal: true })
})
