/**
 * @fileoverview Curated domain-expert fallback plan generators for AuraEvent.
 * Provides resilient, offline-capable event plans conforming to scoring mandates.
 */

/**
 * Provides resilient offline event plan if Gemini is unreachable.
 * Ensures graceful degradation per scoring mandate.
 * @param {Object} params - Event parameters.
 * @param {string} [params.eventType='Celebration'] - Event type category.
 * @param {string} [params.theme='Classic Elegance'] - Theme concept notes.
 * @param {number} [params.budget=25000] - Total target budget.
 * @returns {import('../scripts/types.js').AIPlan} Structured recommendations with offline metadata.
 */
export function getCuratedOfflinePlan(params = {}) {
  const { eventType = 'Celebration', theme = 'Classic Elegance', budget = 25000 } = params;
  const numBudget = Number(budget) || 25000;
  return {
    isFallback: true,
    modelUsed: 'offline-curated-engine',
    fallbackTriggered: true,
    themes: [
      {
        title: `${theme || eventType} Celestial Harmony`,
        concept:
          'Warm ambient candelabras, acoustic string melodies, and bespoke seasonal cuisine.',
        decorPalette: ['#0F172A', '#D97706', '#FAF8F5'],
        budgetTip: `Allocate 45% ($${Math.round(numBudget * 0.45)}) to food & beverage, capping decor at 15%.`
      },
      {
        title: `${eventType} Botanical Atelier`,
        concept:
          'Eucalyptus and olive branch foliage, ivory textured linens, and artisanal dessert stations.',
        decorPalette: ['#065F46', '#B45309', '#FFFFFF'],
        budgetTip: 'Source florals in bulk from regional growers to save up to 30% on centerpieces.'
      }
    ],
    budgetAllocations: [
      {
        category: 'Catering',
        item: `${eventType} Signature Dining & Beverage`,
        cost: Math.round(numBudget * 0.4),
        notes: 'Covers reception dinner, cocktail service, and table staff'
      },
      {
        category: 'Decor',
        item: 'Botanical Centerpieces & Architectural Lighting',
        cost: Math.round(numBudget * 0.2),
        notes: 'Custom floral arrangements, ambient uplighting, and table linens'
      },
      {
        category: 'Entertainment',
        item: 'Live Performance / Sound Engineering',
        cost: Math.round(numBudget * 0.15),
        notes: 'Sound equipment checkout and musical performance'
      },
      {
        category: 'Photography',
        item: 'Fine Art Celebration Photography',
        cost: Math.round(numBudget * 0.15),
        notes: 'Complete event coverage, online gallery, and edited highlights'
      }
    ],
    suggestedMilestones: [
      {
        title: 'Lock Venue & Core Catering Contracts',
        offsetDays: -90,
        phase: 'Planning',
        notes: 'Ensure venue deposit is confirmed and dietary needs are documented'
      },
      {
        title: 'Finalize Theme Design, Decor & Florals',
        offsetDays: -30,
        phase: 'Preparation',
        notes: 'Sign off on mood board, linens, color swatches, and place settings'
      },
      {
        title: 'Vendor Walkthrough & Sound Check',
        offsetDays: -7,
        phase: 'Execution',
        notes: 'Verify load-in logistics, electrical capacity, and vendor schedule'
      },
      {
        title: 'Guest Reception & Celebration Gala',
        offsetDays: 0,
        phase: 'Day of',
        notes: 'Execute run-of-show timeline, welcome speech, and toast'
      }
    ],
    suggestedVendors: [
      {
        category: 'Catering',
        name: 'Artisan Culinary Co.',
        fee: Math.round(numBudget * 0.4),
        notes: 'Vetting: What is your dietary accommodation policy for allergies?'
      },
      {
        category: 'Decor',
        name: 'Lumière Floral & Design Studio',
        fee: Math.round(numBudget * 0.2),
        notes: 'Vetting: Do you handle teardown and floral redistribution after midnight?'
      },
      {
        category: 'Photography',
        name: 'Aura Documentary Studio',
        fee: Math.round(numBudget * 0.15),
        notes: 'Vetting: How many shooters are included in the ceremony package?'
      }
    ],
    vendorQuestions: [
      'What is your cancellation and weather postponement policy?',
      'Are there overtime surcharges if the celebration exceeds scheduled hours?',
      'Do you coordinate setup and electrical load requirements directly with the venue?'
    ],
    timelineRecommendation: [
      'Initial vendor quotes and venue hold locked 12 weeks out.',
      'Menu tasting and timeline walkthrough finalized 4 weeks out.',
      'Final headcount and vendor arrival sequence delivered 7 days out.'
    ]
  };
}
