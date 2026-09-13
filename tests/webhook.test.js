process.env.NODE_ENV = 'test'; process.env.VERIFY_TOKEN = 'test-token';
jest.mock('../src/services/whatsappService', () => ({ sendTextMessage: jest.fn(() => Promise.resolve()), sendMainMenu: jest.fn(() => Promise.resolve()), sendServiceMenu: jest.fn(() => Promise.resolve()), sendContactMethodMenu: jest.fn(() => Promise.resolve()), sendConsentButtons: jest.fn(() => Promise.resolve()), sendConfirmationButtons: jest.fn(() => Promise.resolve()), WhatsAppConfigurationError: class WhatsAppConfigurationError extends Error {} }));
const request = require('supertest'); const app = require('../src/app'); const sessions = require('../src/repositories/sessionRepository'); const customers = require('../src/repositories/customerRepository'); const whatsapp = require('../src/services/whatsappService'); const conversation = require('../src/services/conversationService'); const metaConfig = require('../src/config/env');
function payload(id, from, body) { return { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { contacts: [{ profile: { name: 'Tester' } }], messages: [{ from, id, timestamp: '1710000000', type: 'text', text: { body } }] } }] }] }; }
describe('HTTP routes and webhooks', () => {
  beforeEach(() => { jest.restoreAllMocks(); sessions.clear(); customers.clear(); jest.clearAllMocks(); });
  test('GET /health returns 200', async () => { const r = await request(app).get('/health'); expect(r.status).toBe(200); expect(r.body.success).toBe(true); expect(r.body.timestamp).toBeTruthy(); });
  test('webhook verification succeeds with the correct token', async () => { const r = await request(app).get('/webhook').query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'test-token', 'hub.challenge': 'abc' }); expect(r.status).toBe(200); expect(r.text).toBe('abc'); });
  test('webhook verification fails with an incorrect token', async () => { const r = await request(app).get('/webhook').query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': 'abc' }); expect(r.status).toBe(403); });
  test('POST webhook acknowledges and processes Hi', async () => { const r = await request(app).post('/webhook').send(payload('m-1', '94770000001', 'Hi')); expect(r.status).toBe(200); await new Promise((resolve) => setImmediate(resolve)); expect(whatsapp.sendMainMenu).toHaveBeenCalledWith('94770000001'); });
  test('duplicate webhook IDs are processed only once', async () => { await request(app).post('/webhook').send(payload('m-duplicate', '94770000001', 'Hi')); await request(app).post('/webhook').send(payload('m-duplicate', '94770000001', 'Hi')); await new Promise((resolve) => setImmediate(resolve)); expect(whatsapp.sendMainMenu).toHaveBeenCalledTimes(1); });
  test('acknowledges before asynchronous message processing completes', async () => {
    jest.spyOn(conversation, 'processIncoming').mockImplementationOnce(() => new Promise(() => {}));
    const r = await request(app).post('/webhook').send(payload('m-slow', '94770000001', 'Hi'));
    expect(r.status).toBe(200);
  });
  test('does not attempt a fallback when Meta configuration is missing', async () => {
    jest.spyOn(metaConfig, 'hasMetaConfig').mockReturnValue(false);
    jest.spyOn(conversation, 'processIncoming').mockRejectedValueOnce(new Error('processing failed'));
    await request(app).post('/webhook').send(payload('m-no-config', '94770000001', 'Hi'));
    await new Promise((resolve) => setImmediate(resolve));
    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });
  test('attempts one friendly fallback for a processing error when Meta is configured', async () => {
    jest.spyOn(metaConfig, 'hasMetaConfig').mockReturnValue(true);
    jest.spyOn(conversation, 'processIncoming').mockRejectedValueOnce(new Error('processing failed'));
    await request(app).post('/webhook').send(payload('m-fallback', '94770000001', 'Hi'));
    await new Promise((resolve) => setImmediate(resolve));
    expect(whatsapp.sendTextMessage).toHaveBeenCalledTimes(1);
  });
  test('does not recursively fall back for a WhatsApp configuration error', async () => {
    jest.spyOn(metaConfig, 'hasMetaConfig').mockReturnValue(true);
    jest.spyOn(conversation, 'processIncoming').mockRejectedValueOnce(new whatsapp.WhatsAppConfigurationError());
    await request(app).post('/webhook').send(payload('m-config-error', '94770000001', 'Hi'));
    await new Promise((resolve) => setImmediate(resolve));
    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });
  test('catches a rejected fallback send', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(metaConfig, 'hasMetaConfig').mockReturnValue(true);
    jest.spyOn(conversation, 'processIncoming').mockRejectedValueOnce(new Error('processing failed'));
    whatsapp.sendTextMessage.mockRejectedValueOnce(new Error('fallback failed'));
    await request(app).post('/webhook').send(payload('m-fallback-error', '94770000001', 'Hi'));
    await new Promise((resolve) => setImmediate(resolve));
    expect(errorSpy).toHaveBeenCalledWith('[fallback message] Error');
  });
});
