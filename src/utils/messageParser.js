function asArray(value) { return Array.isArray(value) ? value : []; }
function parseWebhook(payload) {
  const values = asArray(payload && payload.entry).flatMap((entry) =>
    asArray(entry && entry.changes).map((change) => change && change.value).filter((value) => value && typeof value === 'object')
  );
  const messages = values.flatMap((value) => {
    const contact = asArray(value.contacts)[0];
    const profileName = contact && contact.profile && contact.profile.name;
    return asArray(value.messages).filter((message) => message && typeof message === 'object').map((message) => ({
      phoneNumber: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type,
      text: message.text && message.text.body,
      replyId: message.interactive && (
        (message.interactive.button_reply && message.interactive.button_reply.id) ||
        (message.interactive.list_reply && message.interactive.list_reply.id)
      ),
      profileName
    })).filter((message) => message.phoneNumber && message.messageId);
  });
  return { messages, statusEvents: values.flatMap((value) => asArray(value.statuses)) };
}
module.exports = { parseWebhook };
