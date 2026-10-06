import { describe, it, expect } from 'vitest'
import {
  normalizeTransactions,
  calculateDailyRevenue,
  calculateCurrencyTotals,
  convertAmount,
} from './model'

describe('Фінансові розрахунки', () => {
  it('зберігає всі транзакції, але виключає неоплачені з підсумків', () => {
    const items = normalizeTransactions(
      {
        transactions: [
          { type: 'paid', amount: '100', currency: 'usd' },
          { type: 'pending', amount: 999, currency: 'EUR' },
          { type: 'rejected', amount: 999, currency: 'EUR' },
          { amount: 50, currency: 'USD' },
        ],
      },
      [' 80   eur '],
    )
    expect(items).toHaveLength(5)
    expect(calculateDailyRevenue(items, { EUR: '0.8' })).toEqual({
      total: '250.00',
      currency: 'USD',
    })
    expect(calculateCurrencyTotals(items)).toEqual({
      USD: '150.00',
      EUR: '80.00',
    })
  })
  it('завжди зводить EUR та третю валюту до USD', () => {
    const items = normalizeTransactions({ transactions: [] }, [
      '10 EUR',
      '20 EUR',
      '1000 USD',
      '40 GBP',
    ])
    expect(calculateDailyRevenue(items, { EUR: '0.8', GBP: '0.5' }).total).toBe(
      '1117.50',
    )
  })
  it('точно додає десяткові суми та округлює лише кінцевий еквівалент', () => {
    const items = normalizeTransactions({ transactions: [] }, [
      '0.1 USD',
      '0.2 USD',
    ])
    expect(calculateDailyRevenue(items, {}).total).toBe('0.30')
    const fractions = normalizeTransactions({ transactions: [] }, [
      '1 EUR',
      '1 EUR',
    ])
    expect(calculateDailyRevenue(fractions, { EUR: '3' }).total).toBe('0.67')
    const halves = normalizeTransactions({ transactions: [] }, ['1.005 USD'])
    expect(calculateDailyRevenue(halves, {}).total).toBe('1.01')
  })
  it('зберігає великі суми без перетворення на Number', () => {
    const items = normalizeTransactions({ transactions: [] }, [
      '9007199254740993.01 USD',
      '0.01 USD',
    ])
    expect(calculateDailyRevenue(items, {}).total).toBe('9007199254740993.02')
  })
  it('відхиляє некоректний JSON і недоступні курси', () => {
    expect(() => normalizeTransactions({}, [])).toThrow()
    expect(() =>
      normalizeTransactions({ transactions: [] }, ['oops USD']),
    ).toThrow()
    const items = normalizeTransactions({ transactions: [] }, ['10 EUR'])
    expect(() => calculateDailyRevenue(items, {})).toThrow()
    expect(() => calculateDailyRevenue(items, { EUR: '0' })).toThrow()
  })
  it('обробляє порожній набір, однакову валюту та крос-конвертацію', () => {
    expect(calculateDailyRevenue([], {})).toEqual({
      total: '0.00',
      currency: 'USD',
    })
    expect(convertAmount('10', 'EUR', 'EUR', {})).toBe('10.00')
    expect(convertAmount('10', 'EUR', 'GBP', { EUR: '0.8', GBP: '0.5' })).toBe(
      '6.25',
    )
  })
})
