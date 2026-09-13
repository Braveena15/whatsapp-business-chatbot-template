const axios = require('axios');
const { env, hasMetaConfig, missingMetaConfig } = require('../config/env');
const businessConfig = require('../config/businessConfig');

class WhatsAppConfigurationError extends Error {
  constructor() {
    super(`WhatsApp is not configured. Missing: ${missingMetaConfig().join(', ')}.`);
    this.name = 'WhatsAppConfigurationError';
  }
}

function config() {
  if (!hasMetaConfig()) throw new WhatsAppConfigurationError();
  return { headers: { Authorization: `Bearer ${env.accessToken}`, 'Content-Type': 'application/json' } };
}

function url() { return `https://graph.facebook.com/${env.graphApiVersion}/${env.phoneNumberId}/messages`; }
function send(to, message) { return axios.post(url(), { messaging_product: 'whatsapp', to, ...message }, config()); }
function sendTextMessage(to, body) { return send(to, { type: 'text', text: { body } }); }

function sendReplyButtons(to, body, buttons) {
  return send(to, {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: { buttons: buttons.map((button) => ({ type: 'reply', reply: { id: button.id, title: button.title } })) }
    }
  });
}

function sendMainMenu(to) {
  return sendReplyButtons(to, `${businessConfig.welcomeMessage}\n\nPlease choose an option.`, businessConfig.chatbot.mainMenuButtons);
}

function sendServiceMenu(to) {
  return sendReplyButtons(to, 'Please select your preferred service.', businessConfig.services.map(({ id, title }) => ({ id, title })));
}

function sendContactMethodMenu(to) {
  return sendReplyButtons(to, 'How would you prefer our team to contact you?', [
    { id: 'CONTACT_WHATSAPP', title: 'WhatsApp' },
    { id: 'CONTACT_PHONE', title: 'Phone Call' },
    { id: 'CONTACT_EMAIL', title: 'Email' }
  ]);
}

function sendConsentButtons(to) {
  return sendReplyButtons(to, `${businessConfig.businessName} ${businessConfig.chatbot.consentText}\n\nDo you agree?`, [
    { id: 'CONSENT_AGREE', title: 'I Agree' },
    { id: 'CONSENT_CANCEL', title: 'Cancel' }
  ]);
}

function sendConfirmationButtons(to, body) {
  return sendReplyButtons(to, body, [{ id: 'CONFIRM_REGISTRATION', title: 'Confirm' }, { id: 'RESTART_REGISTRATION', title: 'Start Again' }]);
}

function markMessageAsRead(messageId) {
  return axios.post(url(), { messaging_product: 'whatsapp', status: 'read', message_id: messageId }, config());
}

module.exports = {
  sendTextMessage, sendReplyButtons, sendMainMenu, sendServiceMenu, sendContactMethodMenu,
  sendConsentButtons, sendConfirmationButtons, markMessageAsRead, WhatsAppConfigurationError
};
