import { describe, it, expect } from 'vitest'
import {
  formatKes,
  kesToUsdCents,
  formatUsd,
  formatDualPrice,
  calculateUpgradePriceKes,
} from '@/lib/pricing'

describe('Pricing and Currency Utilities', () => {
  it('formats KES minor units to major formatted currency', () => {
    expect(formatKes(450000)).toBe('KES 4,500.00')
    expect(formatKes(0)).toBe('KES 0.00')
    expect(formatKes(1700000)).toBe('KES 17,000.00')
  })

  it('converts KES minor units to USD cents rounded up to the next whole cent', () => {
    // 5,000 KES (500,000 minor units) at 130 exchange rate:
    // 500,000 / 130 = 3846.1538... -> ceil is 3847 cents ($38.47)
    expect(kesToUsdCents(500000, 130.00)).toBe(3847)

    // 4,500 KES (450,000 minor units) at 130:
    // 450,000 / 130 = 3461.538... -> ceil is 3462 cents ($34.62)
    expect(kesToUsdCents(450000, 130.00)).toBe(3462)

    // Zero returns 0
    expect(kesToUsdCents(0, 130.00)).toBe(0)
  })

  it('formats USD cents to dollar string', () => {
    expect(formatUsd(3847)).toBe('$38.47')
    expect(formatUsd(13077)).toBe('$130.77')
    expect(formatUsd(0)).toBe('$0.00')
  })

  it('formats dual price display', () => {
    expect(formatDualPrice(500000, 130.00)).toBe('KES 5,000.00 ($38.47)')
  })

  it('calculates bundle upgrade price correctly and never drops below zero', () => {
    // Bundle price 17,000 KES, student previously paid 4,500 KES -> Upgrade is 12,500 KES
    expect(calculateUpgradePriceKes(1700000, 450000)).toBe(1250000)

    // Student paid more than or equal to bundle price -> Upgrade is 0
    expect(calculateUpgradePriceKes(1700000, 2000000)).toBe(0)
  })
})
