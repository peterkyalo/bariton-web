/**
 * Pricing and currency utilities for Bariton Music Academy.
 */

/**
 * Format KES minor units to human-readable string.
 * e.g., 450000 -> "KES 4,500.00"
 */
export function formatKes(minorUnits) {
  if (minorUnits === null || minorUnits === undefined) return 'KES 0.00';
  const major = Number(minorUnits) / 100;
  return `KES ${major.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert KES minor units to USD minor units (cents) rounded up to the next whole cent.
 * Formula: ceil(kesMinor / exchangeRate)
 */
export function kesToUsdCents(kesMinor, exchangeRate = 130.00) {
  if (!kesMinor || kesMinor <= 0) return 0;
  const rate = Number(exchangeRate) > 0 ? Number(exchangeRate) : 130.00;
  return Math.ceil(Number(kesMinor) / rate);
}

/**
 * Format USD cents to string.
 * e.g., 3847 -> "$38.47"
 */
export function formatUsd(cents) {
  if (cents === null || cents === undefined) return '$0.00';
  const major = Number(cents) / 100;
  return `$${major.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Dual price display string: "KES 4,500.00 / $38.47"
 */
export function formatDualPrice(kesMinor, exchangeRate = 130.00) {
  const usdCents = kesToUsdCents(kesMinor, exchangeRate);
  return `${formatKes(kesMinor)} (${formatUsd(usdCents)})`;
}

/**
 * Calculate upgrade price in KES minor units:
 * max(0, bundlePriceKes - totalPaidForOwnedModulesKes)
 */
export function calculateUpgradePriceKes(bundlePriceKes, totalPaidKes) {
  return Math.max(0, Number(bundlePriceKes || 0) - Number(totalPaidKes || 0));
}
