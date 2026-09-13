describe('WhatsApp Cloud API service', () => {
  beforeEach(() => { jest.resetModules(); process.env.VERIFY_TOKEN = 'verify'; process.env.WHATSAPP_ACCESS_TOKEN = 'token-for-test'; process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-id'; process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'waba-id'; process.env.GRAPH_API_VERSION = 'v25.0'; });
  test('sends official interactive button payloads', async () => {
    const post = jest.fn().mockResolvedValue({ data: {} });
    jest.doMock('axios', () => ({ post }));
    const service = require('../src/services/whatsappService');
    await service.sendReplyButtons('94770000001', 'Choose', [{ id: 'A', title: 'Option A' }]);
    expect(post).toHaveBeenCalledWith('https://graph.facebook.com/v25.0/phone-id/messages', {
      messaging_product: 'whatsapp',
      to: '94770000001',
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: 'Choose' },
        action: { buttons: [{ type: 'reply', reply: { id: 'A', title: 'Option A' } }] }
      }
    }, { headers: { Authorization: 'Bearer token-for-test', 'Content-Type': 'application/json' } });
  });
  test('sends official text payloads', async () => {
    const post = jest.fn().mockResolvedValue({ data: {} });
    jest.doMock('axios', () => ({ post }));
    const service = require('../src/services/whatsappService');
    await service.sendTextMessage('94770000001', 'Hello');
    expect(post).toHaveBeenCalledWith('https://graph.facebook.com/v25.0/phone-id/messages', {
      messaging_product: 'whatsapp', to: '94770000001', type: 'text', text: { body: 'Hello' }
    }, { headers: { Authorization: 'Bearer token-for-test', 'Content-Type': 'application/json' } });
  });
  test.each([
    ['sendMainMenu', ['REGISTER_DETAILS', 'COMPANY_INFO', 'TALK_TO_STAFF']],
    ['sendServiceMenu', ['SERVICE_WASH_FOLD', 'SERVICE_DRY_CLEANING', 'SERVICE_IRONING']],
    ['sendContactMethodMenu', ['CONTACT_WHATSAPP', 'CONTACT_PHONE', 'CONTACT_EMAIL']],
    ['sendConsentButtons', ['CONSENT_AGREE', 'CONSENT_CANCEL']]
  ])('%s exposes the required button IDs', async (method, expectedIds) => {
    const post = jest.fn().mockResolvedValue({ data: {} });
    jest.doMock('axios', () => ({ post }));
    const service = require('../src/services/whatsappService');
    await service[method]('94770000001');
    const buttons = post.mock.calls[0][1].interactive.action.buttons;
    expect(buttons.map((button) => button.reply.id)).toEqual(expectedIds);
  });
  test('confirmation exposes confirm and start-again buttons', async () => {
    const post = jest.fn().mockResolvedValue({ data: {} });
    jest.doMock('axios', () => ({ post }));
    const service = require('../src/services/whatsappService');
    await service.sendConfirmationButtons('94770000001', 'Summary');
    const buttons = post.mock.calls[0][1].interactive.action.buttons;
    expect(buttons.map((button) => button.reply.id)).toEqual(['CONFIRM_REGISTRATION', 'RESTART_REGISTRATION']);
  });
  test('throws a safe configuration error when Meta is absent', () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    const post = jest.fn(); jest.doMock('axios', () => ({ post }));
    const service = require('../src/services/whatsappService');
    expect(() => service.sendTextMessage('94770000001', 'Hello')).toThrow('WhatsApp is not configured');
    expect(post).not.toHaveBeenCalled();
  });
});
