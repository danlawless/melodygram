// Cost estimation utilities for LemonSlice API

interface CostEstimate {
  costUSD: number
  megapixels: number
  duration: number
  resolution: string
  warning?: string
}

export function estimateLemonSliceCost(
  resolution: string = '512',
  durationSeconds: number = 30
): CostEstimate {
  // LemonSlice pricing: $0.00382 USD per megapixel
  const pricePerMegapixel = 0.00382
  
  // Calculate megapixels based on resolution
  let megapixels: number
  switch (resolution) {
    case '256':
      megapixels = (256 * 256) / 1000000 // 0.065536
      break
    case '320':
      megapixels = (320 * 320) / 1000000 // 0.1024
      break
    case '512':
      megapixels = (512 * 512) / 1000000 // 0.262144
      break
    case '640':
      megapixels = (640 * 640) / 1000000 // 0.4096
      break
    default:
      megapixels = (512 * 512) / 1000000 // Default to 512
  }
  
  // Duration affects cost (longer videos = more processing)
  // Estimate: base cost + duration multiplier
  const baseCost = megapixels * pricePerMegapixel
  const durationMultiplier = Math.max(1, durationSeconds / 30) // Scale with duration
  const totalCost = baseCost * durationMultiplier
  
  const estimate: CostEstimate = {
    costUSD: Math.round(totalCost * 100) / 100, // Round to 2 decimals
    megapixels: Math.round(megapixels * 1000000) / 1000000,
    duration: durationSeconds,
    resolution: resolution
  }
  
  // Add warnings for expensive operations
  if (totalCost > 2.0) {
    estimate.warning = 'High cost! Consider shorter duration or lower resolution.'
  } else if (totalCost > 1.0) {
    estimate.warning = 'Moderate cost - monitor spending.'
  }
  
  return estimate
}

export function formatCostEstimate(estimate: CostEstimate): string {
  return `💰 Estimated cost: $${estimate.costUSD} (${estimate.resolution}px, ${estimate.duration}s)`
}

// Cost limits for different usage scenarios
export const COST_LIMITS = {
  TESTING: 0.50,   // $0.50 max for testing
  DEMO: 1.00,      // $1.00 max for demos  
  PRODUCTION: 5.00 // $5.00 max for production
} as const

export function checkCostLimit(estimate: CostEstimate, limit: number): {
  allowed: boolean
  message: string
} {
  if (estimate.costUSD <= limit) {
    return {
      allowed: true,
      message: `✅ Cost ($${estimate.costUSD}) within limit ($${limit})`
    }
  } else {
    return {
      allowed: false,
      message: `❌ Cost ($${estimate.costUSD}) exceeds limit ($${limit}). Reduce duration or resolution.`
    }
  }
} 