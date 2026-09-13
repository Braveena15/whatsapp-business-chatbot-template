const metaConfig = require('../config/env');
const { env } = metaConfig;
const sessions = require('../repositories/sessionRepository');
const conversation = require('../services/conversationService');
const whatsapp = require('../services/whatsappService');
const { parseWebhook } = require('../utils/messageParser');
const { safeError, info } = require('../utils/logger');
function verify(req, res) { const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query; if (mode === 'subscribe' && token && token === env.verifyToken) return res.status(200).send(challenge); return res.sendStatus(403); }
async function safelyProcess(message) {
  try {
    if (sessions.isProcessed(message.messageId)) return;
    sessions.markProcessed(message.messageId);
    await conversation.processIncoming(message);
  } catch (error) {
    safeError('webhook processing', error);
    if (metaConfig.hasMetaConfig() && !(error instanceof whatsapp.WhatsAppConfigurationError)) {
      try { await whatsapp.sendTextMessage(message.phoneNumber, 'Sorry, something went wrong while processing your request. Please type MENU and try again.'); } catch (fallbackError) { safeError('fallback message', fallbackError); }
    }
  }
}
function receive(req, res) {
  // Production deployments should validate X-Hub-Signature-256 before accepting webhook bodies.
  res.sendStatus(200);
  try {
    const parsed = parseWebhook(req.body);
    parsed.statusEvents.forEach((status) => info(`Message status received: ${status.status || 'unknown'}`));
    parsed.messages.forEach((message) => {
      setImmediate(() => {
        safelyProcess(message).catch((error) => safeError('webhook processing task', error));
      });
    });
  } catch (error) {
    safeError('webhook parsing', error);
  }
}
module.exports = { verify, receive, safelyProcess };
