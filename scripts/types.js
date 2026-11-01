/**
 * @fileoverview JSDoc Type Definitions for AuraEvent Data Models and State.
 * Provides explicit typing contracts for core business entities.
 */

/**
 * @typedef {Object} Expense
 * @property {string} id - Unique expense identifier.
 * @property {string} category - Expense category (e.g. Venue, Catering, Decor, etc.).
 * @property {string} description - Line item title or description.
 * @property {number} estimated - Estimated or allocated amount.
 * @property {number} actual - Actual amount spent or committed.
 * @property {'Paid in Full'|'Deposit Paid'|'Pending'} status - Payment status.
 */

/**
 * @typedef {Object} Milestone
 * @property {string} id - Unique milestone identifier.
 * @property {string} title - Milestone title or run-of-show item.
 * @property {string} phase - Operational phase (e.g. Ideation, Logistics, Ceremony, Reception, Breakdown).
 * @property {string} date - ISO date or datetime string (YYYY-MM-DD or YYYY-MM-DDTHH:mm).
 * @property {string} notes - Operational instructions or notes.
 * @property {boolean} completed - Whether milestone is completed.
 */

/**
 * @typedef {Object} Vendor
 * @property {string} id - Unique vendor identifier.
 * @property {string} name - Vendor company or individual name.
 * @property {string} category - Service category.
 * @property {string} contact - Email, phone, or contact reference.
 * @property {number} fee - Quoted or agreed contract fee.
 * @property {'Researching'|'Quoted'|'Contract Sent'|'Confirmed'|'Completed'} status - Booking lifecycle stage.
 */

/**
 * @typedef {Object} VendorChecklistTask
 * @property {string} id - Unique task identifier.
 * @property {string} text - Task description or deliverable.
 * @property {boolean} completed - Whether task is completed.
 */

/**
 * @typedef {Object} AITheme
 * @property {string} name - Creative theme title.
 * @property {string} concept - Descriptive aesthetic concept.
 * @property {string[]} colorPalette - Hex color strings representing the motif.
 * @property {string} stylingTip - Professional styling guidance.
 */

/**
 * @typedef {Object} AIBudgetAllocation
 * @property {string} category - Expense category.
 * @property {number} percentage - Proportional percentage of total budget.
 * @property {number} suggestedAmount - Computed currency amount.
 * @property {string} reasoning - Strategic allocation rationale.
 */

/**
 * @typedef {Object} AIMilestone
 * @property {string} title - Milestone description.
 * @property {string} phase - Recommended phase.
 * @property {number} targetDaysOffset - Suggested day offset relative to event date.
 * @property {string} [notes] - Actionable notes.
 */

/**
 * @typedef {Object} AIVendorRecommendation
 * @property {string} category - Service category.
 * @property {string} recommendedRole - Role or vendor specialization.
 * @property {number} estimatedCost - Estimated contract fee.
 * @property {string} [rationale] - Key value proposition.
 */

/**
 * @typedef {Object} AIPlan
 * @property {string} [id] - Unique plan identifier.
 * @property {string} [timestamp] - ISO timestamp when generated.
 * @property {string} [modelUsed] - Model identifier that produced the plan.
 * @property {boolean} [fallback] - Whether offline fallback engine was used.
 * @property {AITheme[]} [themes] - Curated theme options.
 * @property {AIBudgetAllocation[]} [budgetAllocations] - Suggested budget splits.
 * @property {AIMilestone[]} [milestones] - Recommended run-of-show milestones.
 * @property {AIVendorRecommendation[]} [vendors] - Suggested vendor partners.
 * @property {string[]} [vendorQuestions] - Essential vetting questions for vendors.
 */

/**
 * @typedef {Object} SavedPlan
 * @property {string} id - Saved plan identifier.
 * @property {string} title - User-facing plan label.
 * @property {string} timestamp - Generation date/time.
 * @property {string} modelUsed - Model name.
 * @property {AIPlan} plan - Full normalized plan data.
 */

/**
 * @typedef {Object} Celebration
 * @property {string} id - Unique celebration identifier.
 * @property {string} name - Event title.
 * @property {'Wedding'|'Birthday'|'Corporate Event'|'Community Event'|'Anniversary'|'Social Gathering'} type - Category.
 * @property {string} date - Event date (YYYY-MM-DD).
 * @property {number} budget - Total target budget.
 * @property {number} guestCount - Expected guest count.
 * @property {Expense[]} expenses - Line item expenses.
 * @property {Milestone[]} milestones - Run-of-show milestones.
 * @property {Vendor[]} vendors - Contracted and prospective vendors.
 * @property {SavedPlan[]} savedPlans - Saved AI proposals.
 * @property {VendorChecklistTask[]} vendorChecklist - Deliverables checklist.
 */

export {};

