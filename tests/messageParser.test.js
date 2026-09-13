const { parseWebhook } = require('../src/utils/messageParser');

function valuePayload(value) {
  return { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value }] }] };
}

describe('Meta webhook message parser', () => {
  test('parses text messages and contact profile names', () => {
    const result = parseWebhook(valuePayload({
      contacts: [{ profile: { name: 'Nimal' }, wa_id: '94770000001' }],
      messages: [{ from: '94770000001', id: 'text-1', timestamp: '1710000000', type: 'text', text: { body: 'Hello' } }]
    }));
    expect(result.messages).toEqual([expect.objectContaining({
      phoneNumber: '94770000001', messageId: 'text-1', type: 'text', text: 'Hello', profileName: 'Nimal'
    })]);
  });

  test.each([
    ['button_reply', { button_reply: { id: 'REGISTER_DETAILS', title: 'Register Details' } }],
    ['list_reply', { list_reply: { id: 'SERVICE_WASH_FOLD', title: 'Wash & Fold' } }]
  ])('parses interactive %s IDs', (name, interactive) => {
    const result = parseWebhook(valuePayload({
      messages: [{ from: '94770000001', id: name, type: 'interactive', interactive }]
    }));
    expect(result.messages[0].replyId).toBe(Object.values(interactive)[0].id);
  });

  test('returns message status events independently of messages', () => {
    const status = { id: 'wamid.1', status: 'delivered', timestamp: '1710000001', recipient_id: '94770000001' };
    expect(parseWebhook(valuePayload({ statuses: [status] }))).toEqual({ messages: [], statusEvents: [status] });
  });

  test.each([null, {}, { entry: {} }, { entry: [null, { changes: 'invalid' }] }, { entry: [{ changes: [{ value: { messages: {}, statuses: {} } }] }] }])(
    'safely ignores malformed payload %#',
    (payload) => expect(parseWebhook(payload)).toEqual({ messages: [], statusEvents: [] })
  );

  test('drops messages without a sender or message ID', () => {
    const result = parseWebhook(valuePayload({ messages: [{ id: 'missing-from' }, { from: '94770000001' }] }));
    expect(result.messages).toEqual([]);
  });
});
