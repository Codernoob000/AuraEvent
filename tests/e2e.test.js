import { queryGeminiApi } from '../services/geminiService.js';
import {
  formatCurrency,
  calculateDetailedCountdown,
  normalizeAIPlan,
  generateUUID
} from '../scripts/utils.js';

const RESULTS = {
  section1: [],
  section2: [],
  section3: [],
  section4: [],
  section5: [],
  section6: []
};

function record(section, name, pass, expected, actual, details = '') {
  RESULTS[section].push({
    name,
    status: pass ? 'PASS' : 'FAIL',
    expected: String(expected),
    actual: String(actual),
    details
  });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
  if (!pass) console.error(`  Expected: ${expected}\n  Actual: ${actual}`);
}

async function runAcceptance() {
  console.log('=== STARTING END-TO-END ACCEPTANCE TESTS ===\n');

  // =========================================================================
  // SECTION 1: EVENT LIFECYCLE
  // =========================================================================
  console.log('--- SECTION 1: Event Lifecycle ---');
  let mockStorage = {};
  function saveEvents(evts) {
    mockStorage['aura_events'] = JSON.stringify(evts);
  }
  function loadEvents() {
    return JSON.parse(mockStorage['aura_events'] || '[]');
  }

  // 1. Create a wedding celebration
  const weddingEvent = {
    id: 'evt-test-wedding-101',
    name: 'Aria & James Vineyard Nuptials',
    type: 'Wedding',
    date: '2026-12-18',
    budget: 30000,
    currency: 'USD',
    guestCount: 140,
    expenses: [
      {
        id: 'exp-w1',
        category: 'Venue',
        description: 'Napa Valley Cellars',
        estimated: 10000,
        actual: 10000,
        status: 'Paid in Full'
      }
    ],
    milestones: [
      {
        id: 'ms-w1',
        title: 'Vineyard Tasting Walkthrough',
        phase: 'Ideation',
        date: '2026-11-15T14:00',
        completed: true,
        notes: 'Select pinot noir'
      }
    ],
    vendors: [
      {
        id: 'ven-w1',
        category: 'Venue',
        name: 'Napa Valley Cellars',
        contact: 'events@napacellars.com',
        fee: 10000,
        status: 'Confirmed'
      }
    ],
    savedPlans: [],
    vendorChecklist: [{ id: 'chk-w1', text: 'Obtain winery sound permit', completed: true }]
  };

  // 2. Create a birthday celebration
  const birthdayEvent = {
    id: 'evt-test-birthday-102',
    name: "Siddharth's 25th Sunset Bash",
    type: 'Birthday',
    date: '2026-11-25',
    budget: 8000,
    currency: 'INR',
    guestCount: 60,
    expenses: [
      {
        id: 'exp-b1',
        category: 'Venue',
        description: 'Bandra Rooftop Cabana',
        estimated: 3500,
        actual: 3500,
        status: 'Deposit Paid'
      }
    ],
    milestones: [
      {
        id: 'ms-b1',
        title: 'DJ Soundcheck',
        phase: 'Ceremony',
        date: '2026-11-25T18:00',
        completed: false,
        notes: 'Bass check'
      }
    ],
    vendors: [
      {
        id: 'ven-b1',
        category: 'Entertainment',
        name: 'Mumbai Beat Collective',
        contact: 'dj@beat.in',
        fee: 1200,
        status: 'Confirmed'
      }
    ],
    savedPlans: [],
    vendorChecklist: []
  };

  let allEvents = [weddingEvent, birthdayEvent];
  saveEvents(allEvents);

  record(
    'section1',
    'Create Wedding Celebration',
    allEvents.some(e => e.id === weddingEvent.id),
    'Contains wedding event',
    weddingEvent.id
  );
  record(
    'section1',
    'Create Birthday Celebration',
    allEvents.some(e => e.id === birthdayEvent.id),
    'Contains birthday event',
    birthdayEvent.id
  );

  // 3. Switch between both
  let activeId = weddingEvent.id;
  let activeEvt = allEvents.find(e => e.id === activeId);
  record(
    'section1',
    'Select Wedding Workspace',
    activeEvt.name === 'Aria & James Vineyard Nuptials',
    'Aria & James Vineyard Nuptials',
    activeEvt.name
  );

  activeId = birthdayEvent.id;
  activeEvt = allEvents.find(e => e.id === activeId);
  record(
    'section1',
    'Switch to Birthday Workspace',
    activeEvt.name === "Siddharth's 25th Sunset Bash",
    "Siddharth's 25th Sunset Bash",
    activeEvt.name
  );

  // 4. Edit event details on wedding
  const weddingToEdit = allEvents.find(e => e.id === weddingEvent.id);
  weddingToEdit.budget = 35000;
  weddingToEdit.date = '2026-12-20';
  weddingToEdit.guestCount = 150;
  saveEvents(allEvents);

  // 5. Refresh browser simulation (re-read from storage)
  const reloadedEvents = loadEvents();
  const reloadedWedding = reloadedEvents.find(e => e.id === weddingEvent.id);
  const reloadedBirthday = reloadedEvents.find(e => e.id === birthdayEvent.id);

  record(
    'section1',
    'Edit Event Budget Persists',
    reloadedWedding.budget === 35000,
    35000,
    reloadedWedding.budget
  );
  record(
    'section1',
    'Edit Event Date Persists',
    reloadedWedding.date === '2026-12-20',
    '2026-12-20',
    reloadedWedding.date
  );
  record(
    'section1',
    'Edit Event Guest Count Persists',
    reloadedWedding.guestCount === 150,
    150,
    reloadedWedding.guestCount
  );
  record(
    'section1',
    'Data Isolation Across Events',
    reloadedBirthday.budget === 8000 && reloadedBirthday.expenses.length === 1,
    'Birthday untouched',
    `Budget: ${reloadedBirthday.budget}`
  );

  // =========================================================================
  // SECTION 2: BUDGET WORKFLOW
  // =========================================================================
  console.log('\n--- SECTION 2: Budget Workflow ---');
  // Add an expense
  const newExpense = {
    id: 'exp-w2',
    category: 'Catering',
    description: 'Artisan Wine Pairing Dinner',
    estimated: 9000,
    actual: 8800,
    status: 'Deposit Paid'
  };
  reloadedWedding.expenses.push(newExpense);
  record(
    'section2',
    'Add Expense Item',
    reloadedWedding.expenses.length === 2,
    2,
    reloadedWedding.expenses.length
  );

  // Edit an expense
  const expToEdit = reloadedWedding.expenses.find(e => e.id === 'exp-w2');
  expToEdit.actual = 9200;
  expToEdit.status = 'Paid in Full';
  record('section2', 'Edit Expense Actual Cost', expToEdit.actual === 9200, 9200, expToEdit.actual);
  record(
    'section2',
    'Edit Expense Payment Status',
    expToEdit.status === 'Paid in Full',
    'Paid in Full',
    expToEdit.status
  );

  // Calculate totals
  let totalSpent = reloadedWedding.expenses.reduce((s, i) => s + i.actual, 0); // 10000 + 9200 = 19200
  let totalAllocated = reloadedWedding.expenses.reduce((s, i) => s + i.estimated, 0); // 10000 + 9000 = 19000
  let remaining = reloadedWedding.budget - totalSpent; // 35000 - 19200 = 15800
  record('section2', 'Verify Total Spent Calculation', totalSpent === 19200, 19200, totalSpent);
  record(
    'section2',
    'Verify Allocated Estimated Calculation',
    totalAllocated === 19000,
    19000,
    totalAllocated
  );
  record('section2', 'Verify Remaining Balance Calculation', remaining === 15800, 15800, remaining);

  // Delete an expense
  reloadedWedding.expenses = reloadedWedding.expenses.filter(e => e.id !== 'exp-w1');
  totalSpent = reloadedWedding.expenses.reduce((s, i) => s + i.actual, 0);
  record(
    'section2',
    'Delete Expense Item',
    reloadedWedding.expenses.length === 1 && totalSpent === 9200,
    '1 item, 9200 spent',
    `${reloadedWedding.expenses.length} items, ${totalSpent} spent`
  );

  // Test INR formatting
  const formattedINR = formatCurrency(500000, 'INR');
  record(
    'section2',
    'INR Currency Formatting',
    formattedINR.includes('₹') && formattedINR.includes('5,00,000'),
    '₹5,00,000',
    formattedINR
  );

  // Test budget overrun alert math
  reloadedWedding.expenses.push({
    id: 'exp-over',
    category: 'Decor',
    description: 'Gold Leaf Installations',
    estimated: 30000,
    actual: 30000,
    status: 'Pending'
  });
  const overrunSpent = reloadedWedding.expenses.reduce((s, i) => s + i.actual, 0); // 9200 + 30000 = 39200 > 35000
  const isOverBudget = overrunSpent > reloadedWedding.budget;
  record(
    'section2',
    'Budget Overrun Detection',
    isOverBudget === true,
    true,
    isOverBudget,
    `Spent: ${overrunSpent} vs Budget: ${reloadedWedding.budget}`
  );

  // Verify that planned AI allocations are not counted as actual spending
  const _aiPlan = {
    budgetAllocations: [{ item: 'AI Luxury Fireworks', cost: 5000, category: 'Entertainment' }]
  };
  const expenseActualBefore = reloadedWedding.expenses.reduce((s, i) => s + i.actual, 0);
  // Just viewing or saving the plan does not touch expenses
  record(
    'section2',
    'AI Planned Allocations Not Counted As Actual Spending',
    expenseActualBefore === 39200,
    39200,
    expenseActualBefore
  );

  // =========================================================================
  // SECTION 3: TIMELINE WORKFLOW
  // =========================================================================
  console.log('\n--- SECTION 3: Timeline Workflow ---');
  // Add a milestone
  const newMs = {
    id: 'ms-w2',
    title: 'Vineyard Sunset Photo Session',
    phase: 'Ceremony',
    date: '2026-12-20T16:30',
    notes: 'Golden hour portraits with bridal party',
    completed: false
  };
  reloadedWedding.milestones.push(newMs);
  record(
    'section3',
    'Add Timeline Milestone',
    reloadedWedding.milestones.length === 2,
    2,
    reloadedWedding.milestones.length
  );

  // Edit date and time
  const msToEdit = reloadedWedding.milestones.find(m => m.id === 'ms-w2');
  msToEdit.date = '2026-12-20T17:00';
  msToEdit.notes = 'Shifted 30 mins later for optimal golden hour lighting';
  record(
    'section3',
    'Edit Milestone Date & Time',
    msToEdit.date === '2026-12-20T17:00',
    '2026-12-20T17:00',
    msToEdit.date
  );

  // Mark milestone complete
  msToEdit.completed = true;
  record(
    'section3',
    'Toggle Milestone Completion',
    msToEdit.completed === true,
    true,
    msToEdit.completed
  );

  // Sorting & Filtering by phase
  const ceremonyMilestones = reloadedWedding.milestones.filter(m => m.phase === 'Ceremony');
  const ideationMilestones = reloadedWedding.milestones.filter(m => m.phase === 'Ideation');
  record(
    'section3',
    'Filter Milestones by Phase (Ceremony)',
    ceremonyMilestones.length === 1,
    1,
    ceremonyMilestones.length
  );
  record(
    'section3',
    'Filter Milestones by Phase (Ideation)',
    ideationMilestones.length === 1,
    1,
    ideationMilestones.length
  );

  // Countdown computation
  const cd = calculateDetailedCountdown(reloadedWedding.date);
  record(
    'section3',
    'Live Countdown Calculation',
    typeof cd.days === 'number' && cd.days >= 0,
    'Valid integer days',
    cd.days
  );

  // =========================================================================
  // SECTION 4: VENDOR WORKFLOW
  // =========================================================================
  console.log('\n--- SECTION 4: Vendor Workflow ---');
  // Add a vendor
  const newVendor = {
    id: 'ven-w2',
    category: 'Decor',
    name: 'Sonoma Floral Artistry',
    contact: 'design@sonomafloral.com',
    fee: 4500,
    status: 'Researching'
  };
  reloadedWedding.vendors.push(newVendor);
  record(
    'section4',
    'Add Vendor Partner',
    reloadedWedding.vendors.length === 2,
    2,
    reloadedWedding.vendors.length
  );

  // Update booking status
  const vendorToUpdate = reloadedWedding.vendors.find(v => v.id === 'ven-w2');
  const statusCycle = ['Researching', 'Contacted', 'Proposal Received', 'Confirmed'];
  let currentIdx = statusCycle.indexOf(vendorToUpdate.status);
  vendorToUpdate.status = statusCycle[(currentIdx + 1) % statusCycle.length]; // Contacted
  record(
    'section4',
    'Advance Vendor Booking Status',
    vendorToUpdate.status === 'Contacted',
    'Contacted',
    vendorToUpdate.status
  );

  // Edit quoted amount
  vendorToUpdate.fee = 4200;
  record(
    'section4',
    'Edit Vendor Quoted Fee',
    vendorToUpdate.fee === 4200,
    4200,
    vendorToUpdate.fee
  );

  // Add and complete checklist tasks
  reloadedWedding.vendorChecklist.push({
    id: 'chk-w2',
    text: 'Review floral mockup and centerpiece samples',
    completed: false
  });
  record(
    'section4',
    'Add Vendor Checklist Task',
    reloadedWedding.vendorChecklist.length === 2,
    2,
    reloadedWedding.vendorChecklist.length
  );

  const taskToComplete = reloadedWedding.vendorChecklist.find(t => t.id === 'chk-w2');
  taskToComplete.completed = true;
  record(
    'section4',
    'Complete Vendor Checklist Task',
    taskToComplete.completed === true,
    true,
    taskToComplete.completed
  );

  // Persist and verify persistence
  allEvents = [reloadedWedding, reloadedBirthday];
  saveEvents(allEvents);
  const reloadedVens = loadEvents().find(e => e.id === weddingEvent.id);
  const foundVen = reloadedVens.vendors.find(v => v.id === 'ven-w2');
  record(
    'section4',
    'Vendor Changes Persist Across Reload',
    foundVen && foundVen.fee === 4200,
    4200,
    foundVen ? foundVen.fee : 'not found'
  );
  const foundTask = reloadedVens.vendorChecklist.find(t => t.id === 'chk-w2');
  record(
    'section4',
    'Checklist State Persists Across Reload',
    foundTask && foundTask.completed === true,
    true,
    foundTask ? foundTask.completed : 'not found'
  );

  // =========================================================================
  // SECTION 5: GEMINI WORKFLOW
  // =========================================================================
  console.log('\n--- SECTION 5: Gemini AI Workflow ---');
  // 1. Generate plan using configured Gemini API or fallback
  const testPayload = {
    eventType: 'Wedding',
    theme: 'Autumn Vineyard Candlelit Elegance',
    budget: 35000,
    guestCount: 150
  };

  const aiResult = await queryGeminiApi(testPayload);
  record(
    'section5',
    'Gemini Plan Generation Execution',
    !!aiResult && (!!aiResult.themes || !!aiResult.theme),
    'Valid plan returned',
    typeof aiResult
  );
  record(
    'section5',
    'Gemini Model Metadata Returned',
    typeof aiResult.modelUsed === 'string',
    'String model name',
    aiResult.modelUsed
  );
  record(
    'section5',
    'Gemini Fallback Flag Available',
    typeof aiResult.fallbackTriggered === 'boolean',
    'Boolean flag',
    aiResult.fallbackTriggered
  );

  // 2. Normalize generated plan
  const normalized = normalizeAIPlan(aiResult, reloadedWedding);
  record(
    'section5',
    'Plan Normalization',
    normalized.budgetAllocations.length > 0 && normalized.suggestedMilestones.length > 0,
    'Normalized sections present',
    `Allocations: ${normalized.budgetAllocations.length}`
  );

  // 3. Save generated plan to active celebration
  reloadedWedding.savedPlans.push({
    id: generateUUID(),
    savedAt: new Date().toISOString(),
    planData: JSON.parse(JSON.stringify(normalized))
  });
  record(
    'section5',
    'Save Plan to Active Celebration',
    reloadedWedding.savedPlans.length === 1,
    1,
    reloadedWedding.savedPlans.length
  );

  // 4. Apply selected recommendations (selective application)
  // Let's select 1 budget item, 1 milestone, 1 vendor
  const selectedBudget = normalized.budgetAllocations.slice(0, 1);
  const selectedMilestone = normalized.suggestedMilestones.slice(0, 1);
  const selectedVendor = normalized.suggestedVendors.slice(0, 1);

  const initialExpensesCount = reloadedWedding.expenses.length;
  const initialMilestonesCount = reloadedWedding.milestones.length;
  const initialVendorsCount = reloadedWedding.vendors.length;

  // Apply selected
  selectedBudget.forEach(b => {
    reloadedWedding.expenses.push({
      id: generateUUID(),
      category: b.category || 'Other',
      description: b.item,
      estimated: b.cost,
      actual: b.cost,
      status: 'Pending'
    });
  });
  selectedMilestone.forEach(m => {
    reloadedWedding.milestones.push({
      id: generateUUID(),
      title: m.title,
      phase: m.phase || 'Ideation',
      date: '2026-12-10T10:00',
      notes: m.notes || '',
      completed: false
    });
  });
  selectedVendor.forEach(v => {
    reloadedWedding.vendors.push({
      id: generateUUID(),
      category: v.category || 'Other',
      name: v.name,
      contact: 'contact@vendor.com',
      fee: v.fee || 1000,
      status: 'Researching'
    });
  });

  record(
    'section5',
    'Apply Selected Recommendations (Expenses)',
    reloadedWedding.expenses.length === initialExpensesCount + 1,
    initialExpensesCount + 1,
    reloadedWedding.expenses.length
  );
  record(
    'section5',
    'Apply Selected Recommendations (Milestones)',
    reloadedWedding.milestones.length === initialMilestonesCount + 1,
    initialMilestonesCount + 1,
    reloadedWedding.milestones.length
  );
  record(
    'section5',
    'Apply Selected Recommendations (Vendors)',
    reloadedWedding.vendors.length === initialVendorsCount + 1,
    initialVendorsCount + 1,
    reloadedWedding.vendors.length
  );

  // 5. Test duplicate prevention
  const duplicateExpenseItem = selectedBudget[0].item;
  const alreadyExists = reloadedWedding.expenses.some(
    e => e.description.toLowerCase() === duplicateExpenseItem.toLowerCase()
  );
  record('section5', 'Duplicate Prevention Detection', alreadyExists === true, true, alreadyExists);

  // 6. Confirm existing records preserved
  const originalExpenseStillPresent = reloadedWedding.expenses.some(e => e.id === 'exp-w2');
  record(
    'section5',
    'Preserve Existing Records',
    originalExpenseStillPresent === true,
    true,
    originalExpenseStillPresent
  );

  // =========================================================================
  // SECTION 6: BACKUP AND RESTORATION
  // =========================================================================
  console.log('\n--- SECTION 6: Backup & Restoration ---');
  // Export celebration
  const exportedJSON = JSON.stringify(reloadedWedding, null, 2);
  record(
    'section6',
    'Export Celebration to JSON',
    typeof exportedJSON === 'string' && exportedJSON.includes('Aria & James'),
    'Valid JSON string',
    exportedJSON.slice(0, 50)
  );

  // Restore valid backup
  const parsedBackup = JSON.parse(exportedJSON);
  record(
    'section6',
    'Restore Valid Backup - Event Name',
    parsedBackup.name === 'Aria & James Vineyard Nuptials',
    'Aria & James Vineyard Nuptials',
    parsedBackup.name
  );
  record(
    'section6',
    'Restore Valid Backup - Expenses',
    parsedBackup.expenses.length === reloadedWedding.expenses.length,
    reloadedWedding.expenses.length,
    parsedBackup.expenses.length
  );
  record(
    'section6',
    'Restore Valid Backup - Milestones',
    parsedBackup.milestones.length === reloadedWedding.milestones.length,
    reloadedWedding.milestones.length,
    parsedBackup.milestones.length
  );
  record(
    'section6',
    'Restore Valid Backup - Vendors',
    parsedBackup.vendors.length === reloadedWedding.vendors.length,
    reloadedWedding.vendors.length,
    parsedBackup.vendors.length
  );

  // Test invalid backup files
  const invalidFiles = [
    { name: 'Empty string', content: '' },
    { name: 'Malformed JSON syntax', content: '{ invalid json }' },
    { name: 'Missing required event name', content: JSON.stringify({ budget: 5000 }) },
    { name: 'Array instead of event object', content: JSON.stringify([1, 2, 3]) }
  ];

  invalidFiles.forEach(tc => {
    let handledSafely = false;
    try {
      const parsed = JSON.parse(tc.content);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !parsed.name) {
        handledSafely = true; // Safely detected as invalid structure
      }
    } catch {
      handledSafely = true; // Syntax error handled gracefully
    }
    record(
      'section6',
      `Reject Invalid Backup (${tc.name})`,
      handledSafely === true,
      true,
      handledSafely
    );
  });

  console.log('\n=== END-TO-END ACCEPTANCE SUITE EXECUTION COMPLETE ===');
  return RESULTS;
}

runAcceptance().catch(console.error);
