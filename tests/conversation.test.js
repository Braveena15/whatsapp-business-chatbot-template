jest.mock('../src/services/whatsappService', () => ({
  sendTextMessage: jest.fn(() => Promise.resolve()), sendMainMenu: jest.fn(() => Promise.resolve()), sendServiceMenu: jest.fn(() => Promise.resolve()), sendContactMethodMenu: jest.fn(() => Promise.resolve()), sendConsentButtons: jest.fn(() => Promise.resolve()), sendConfirmationButtons: jest.fn(() => Promise.resolve()),
  WhatsAppConfigurationError: class WhatsAppConfigurationError extends Error {}
}));
const conversation = require('../src/services/conversationService');
const sessions = require('../src/repositories/sessionRepository');
const customers = require('../src/repositories/customerRepository');
const whatsapp = require('../src/services/whatsappService');
const stages = require('../src/constants/conversationStages');
describe('registration conversation', () => {
  const phone = '94770000001';
  beforeEach(() => { sessions.clear(); customers.clear(); jest.clearAllMocks(); });

  test.each(['Hi', 'Hello', 'Start', 'Menu'])('%s returns the main menu', async (command) => {
    await conversation.handleText(phone, command);
    expect(whatsapp.sendMainMenu).toHaveBeenCalledWith(phone);
  });

  test('register details starts waiting for name', async () => { await conversation.handleAction(phone, 'REGISTER_DETAILS'); expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_NAME); });

  test('rejects invalid names and advances a valid name to email', async () => {
    await conversation.handleAction(phone, 'REGISTER_DETAILS');
    await conversation.handleText(phone, '');
    expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_NAME);
    await conversation.handleText(phone, 'Nimal Perera');
    expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_EMAIL);
  });

  test('rejects invalid emails and advances a valid email to service', async () => {
    await conversation.handleAction(phone, 'REGISTER_DETAILS');
    await conversation.handleText(phone, 'Nimal Perera');
    await conversation.handleText(phone, 'invalid');
    expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_EMAIL);
    await conversation.handleText(phone, 'nimal@example.com');
    expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_SERVICE);
    expect(whatsapp.sendServiceMenu).toHaveBeenCalledWith(phone);
  });

  test.each([
    ['SERVICE_WASH_FOLD', 'Wash & Fold'],
    ['SERVICE_DRY_CLEANING', 'Dry Cleaning'],
    ['SERVICE_IRONING', 'Ironing']
  ])('selecting %s advances to address', async (action, value) => {
    await reachService();
    await conversation.handleAction(phone, action);
    expect(sessions.get(phone)).toMatchObject({ stage: stages.WAITING_FOR_ADDRESS, data: { preferredService: value } });
  });

  test('rejects a short address and advances a complete address to contact method', async () => {
    await reachService();
    await conversation.handleAction(phone, 'SERVICE_WASH_FOLD');
    await conversation.handleText(phone, 'No');
    expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_ADDRESS);
    await conversation.handleText(phone, 'No. 25, Main Road, Malabe');
    expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_CONTACT_METHOD);
    expect(whatsapp.sendContactMethodMenu).toHaveBeenCalledWith(phone);
  });

  test.each([
    ['CONTACT_WHATSAPP', 'WhatsApp'],
    ['CONTACT_PHONE', 'Phone Call'],
    ['CONTACT_EMAIL', 'Email']
  ])('selecting %s advances to consent', async (action, value) => {
    await reachContactMethod();
    await conversation.handleAction(phone, action);
    expect(sessions.get(phone)).toMatchObject({ stage: stages.WAITING_FOR_CONSENT, data: { preferredContactMethod: value } });
    expect(whatsapp.sendConsentButtons).toHaveBeenCalledWith(phone);
  });

  test('consent agreement advances to confirmation and confirmation saves the customer', async () => {
    await reachConsent();
    await conversation.handleAction(phone, 'CONSENT_AGREE');
    expect(sessions.get(phone)).toMatchObject({ stage: stages.WAITING_FOR_CONFIRMATION, data: { consentGiven: true } });
    expect(whatsapp.sendConfirmationButtons).toHaveBeenCalledWith(phone, expect.stringContaining('Nimal Perera'));
    await conversation.handleAction(phone, 'CONFIRM_REGISTRATION');
    expect(customers.all()).toHaveLength(1);
    expect(customers.all()[0]).toMatchObject({ whatsappNumber: phone, consentGiven: true, status: 'Registered' });
    expect(customers.all()[0].customerId).toMatch(/^CUS-\d{4}-\d{3}$/);
    expect(sessions.get(phone)).toBeUndefined();
  });

  test('consent cancellation removes the session and saves no customer data', async () => {
    await reachConsent();
    await conversation.handleAction(phone, 'CONSENT_CANCEL');
    expect(sessions.get(phone)).toBeUndefined();
    expect(customers.all()).toEqual([]);
  });

  test.each(['CANCEL', 'MENU'])('%s clears an incomplete session', async (command) => {
    await conversation.handleAction(phone, 'REGISTER_DETAILS');
    await conversation.handleText(phone, command);
    expect(sessions.get(phone)).toBeUndefined();
  });

  test('RESTART replaces progress with a fresh name-stage session', async () => {
    await reachService();
    await conversation.handleText(phone, 'RESTART');
    expect(sessions.get(phone)).toMatchObject({ stage: stages.WAITING_FOR_NAME, data: { name: null, email: null } });
  });

  test('confirmation Start Again button replaces progress with a fresh session', async () => {
    await reachConsent();
    await conversation.handleAction(phone, 'CONSENT_AGREE');
    await conversation.handleAction(phone, 'RESTART_REGISTRATION');
    expect(sessions.get(phone)).toMatchObject({ stage: stages.WAITING_FOR_NAME, data: { consentGiven: false } });
  });

  test('HELP responds without changing the current stage', async () => {
    await conversation.handleAction(phone, 'REGISTER_DETAILS');
    await conversation.handleText(phone, 'HELP');
    expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_NAME);
    expect(whatsapp.sendTextMessage).toHaveBeenCalledWith(phone, expect.stringContaining('HELP'));
  });

  test.each(['COMPANY_INFO', 'TALK_TO_STAFF'])('main-menu action %s returns a response', async (action) => {
    await conversation.handleAction(phone, action);
    expect(whatsapp.sendTextMessage).toHaveBeenCalledWith(phone, expect.any(String));
  });

  test('separate phone numbers have separate sessions', async () => { await conversation.handleAction(phone, 'REGISTER_DETAILS'); await conversation.handleAction('94770000002', 'REGISTER_DETAILS'); await conversation.handleText(phone, 'Nimal'); expect(sessions.get(phone).stage).toBe(stages.WAITING_FOR_EMAIL); expect(sessions.get('94770000002').stage).toBe(stages.WAITING_FOR_NAME); });

  async function reachService() {
    await conversation.handleAction(phone, 'REGISTER_DETAILS');
    await conversation.handleText(phone, 'Nimal Perera');
    await conversation.handleText(phone, 'nimal@example.com');
  }

  async function reachContactMethod() {
    await reachService();
    await conversation.handleAction(phone, 'SERVICE_WASH_FOLD');
    await conversation.handleText(phone, 'No. 25, Main Road, Malabe');
  }

  async function reachConsent() {
    await reachContactMethod();
    await conversation.handleAction(phone, 'CONTACT_WHATSAPP');
  }
});
