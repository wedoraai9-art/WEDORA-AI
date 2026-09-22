export const NAV = {
  logo: 'nav-logo',
  home: 'nav-home',
  planWedding: 'nav-plan-wedding',
  aiDesigner: 'nav-ai-designer',
  budget: 'nav-budget',
  venues: 'nav-venues',
  vendors: 'nav-vendors',
  about: 'nav-about',
  startPlanning: 'nav-start-planning-btn',
  mobileToggle: 'nav-mobile-toggle',
};

export const HERO = {
  section: 'hero-section',
  chatInput: 'hero-chat-input',
  sendBtn: 'hero-send-btn',
  suggestedPrompt: (label) => `hero-suggested-${label.toLowerCase().replace(/\s+/g, '-')}`,
  messagesList: 'hero-chat-messages',
  thinkingIndicator: 'hero-thinking-indicator',
};

export const CAPS = {
  section: 'capabilities-section',
  card: (name) => `capability-card-${name.toLowerCase().replace(/\s+/g, '-')}`,
};

export const HOW = {
  section: 'how-it-works-section',
  step: (n) => `how-step-${n}`,
};

export const DESIGNER = {
  section: 'ai-designer-section',
  input: 'designer-input',
  generateBtn: 'designer-generate-btn',
  result: 'designer-result',
};

export const BUDGET = {
  section: 'budget-section',
  totalInput: 'budget-total-input',
  guestsInput: 'budget-guests-input',
  cityInput: 'budget-city-input',
  functionsInput: 'budget-functions-input',
  calcBtn: 'budget-calc-btn',
  result: 'budget-result',
};

export const VENUE = {
  section: 'venues-section',
  filterCity: 'venues-filter-city',
  filterType: 'venues-filter-type',
  card: (id) => `venue-card-${id}`,
  vendorCard: (id) => `vendor-card-${id}`,
};

export const PROMPTS = {
  section: 'prompt-examples-section',
  prompt: (i) => `prompt-example-${i}`,
};

export const CTA = {
  section: 'final-cta-section',
  btn: 'final-cta-btn',
};

export const FOOTER = {
  section: 'footer-section',
};
