const stages = require('../constants/conversationStages');
const sessions = require('../repositories/sessionRepository');
const customerService = require('./customerService');
const whatsapp = require('./whatsappService');
const { validName, validEmail, validAddress } = require('../utils/validators');
const businessConfig = require('../config/businessConfig');

const serviceValues = Object.fromEntries(businessConfig.services.map((service) => [service.id, service.value]));
const contactValues = { CONTACT_WHATSAPP: 'WhatsApp', CONTACT_PHONE: 'Phone Call', CONTACT_EMAIL: 'Email' };

function resetRegistration(phone) {
  const session = sessions.create(phone);
  session.stage = stages.WAITING_FOR_NAME;
  return whatsapp.sendTextMessage(phone, businessConfig.chatbot.registrationIntro);
}

function summary(session) {
  const data = session.data;
  return `Please review your information:\n\nName: ${data.name}\nWhatsApp: +${session.phoneNumber}\nEmail: ${data.email}\nPreferred service: ${data.preferredService}\nPickup address: ${data.pickupAddress}\nPreferred contact method: ${data.preferredContactMethod}\n\nIs this information correct?`;
}

async function globalCommand(phone, input) {
  const command = String(input || '').trim().toUpperCase();
  if (command === 'MENU') { sessions.remove(phone); await whatsapp.sendMainMenu(phone); return true; }
  if (command === 'CANCEL') { sessions.remove(phone); await whatsapp.sendTextMessage(phone, 'The current process has been cancelled. Type MENU to begin again.'); return true; }
  if (command === 'RESTART') { await resetRegistration(phone); return true; }
  if (command === 'HELP') { await whatsapp.sendTextMessage(phone, 'Available commands: MENU, CANCEL, RESTART and HELP.'); return true; }
  return false;
}

async function handleAction(phone, action) {
  if (action === 'REGISTER_DETAILS') return resetRegistration(phone);
  if (action === 'COMPANY_INFO') return whatsapp.sendTextMessage(phone, `${businessConfig.companyInfo}\n\nBusiness hours:\n${businessConfig.businessHours}\n\nType MENU to return to the main menu.`);
  if (action === 'TALK_TO_STAFF') {
    sessions.addSupportRequest(phone);
    return whatsapp.sendTextMessage(phone, 'Thank you. Your request to speak with a staff member has been recorded. A staff member can contact you using this WhatsApp number.\n\nType MENU to return.');
  }

  const session = sessions.get(phone);
  if (!session) return whatsapp.sendTextMessage(phone, 'Please type MENU to begin.');
  if (session.stage === stages.WAITING_FOR_SERVICE && serviceValues[action]) {
    session.data.preferredService = serviceValues[action];
    session.stage = stages.WAITING_FOR_ADDRESS;
    return whatsapp.sendTextMessage(phone, businessConfig.chatbot.addressQuestion);
  }
  if (session.stage === stages.WAITING_FOR_CONTACT_METHOD && contactValues[action]) {
    session.data.preferredContactMethod = contactValues[action];
    session.stage = stages.WAITING_FOR_CONSENT;
    return whatsapp.sendConsentButtons(phone);
  }
  if (session.stage === stages.WAITING_FOR_CONSENT && action === 'CONSENT_CANCEL') {
    sessions.remove(phone);
    return whatsapp.sendTextMessage(phone, 'Registration cancelled.\n\nYour incomplete information was not registered.\n\nType MENU to start again.');
  }
  if (session.stage === stages.WAITING_FOR_CONSENT && action === 'CONSENT_AGREE') {
    session.data.consentGiven = true;
    session.stage = stages.WAITING_FOR_CONFIRMATION;
    return whatsapp.sendConfirmationButtons(phone, summary(session));
  }
  if (session.stage === stages.WAITING_FOR_CONFIRMATION && action === 'RESTART_REGISTRATION') return resetRegistration(phone);
  if (session.stage === stages.WAITING_FOR_CONFIRMATION && action === 'CONFIRM_REGISTRATION') {
    const customer = customerService.register({ whatsappNumber: phone, ...session.data });
    sessions.remove(phone);
    return whatsapp.sendTextMessage(phone, `Your information has been registered successfully.\n\nCustomer reference: ${customer.customerId}\n\nThank you for choosing ${businessConfig.businessName}.\n\nType MENU whenever you need assistance.`);
  }
  return whatsapp.sendTextMessage(phone, 'Please use one of the available options or type MENU.');
}

async function handleText(phone, text) {
  const input = String(text || '').trim();
  if (await globalCommand(phone, input)) return;
  if (['HI', 'HELLO', 'START', 'MENU'].includes(input.toUpperCase())) return whatsapp.sendMainMenu(phone);
  const session = sessions.get(phone);
  if (!session) return whatsapp.sendTextMessage(phone, `Welcome to ${businessConfig.businessName}. Type MENU to see available options.`);
  if (session.stage === stages.WAITING_FOR_NAME) {
    if (!validName(input)) return whatsapp.sendTextMessage(phone, 'Please enter a valid full name.\nExample: Nimal Perera');
    session.data.name = input;
    session.stage = stages.WAITING_FOR_EMAIL;
    return whatsapp.sendTextMessage(phone, `Thank you, ${input.split(/\s+/)[0]}.\n\nPlease enter your email address.\nExample: customer@example.com`);
  }
  if (session.stage === stages.WAITING_FOR_EMAIL) {
    if (!validEmail(input)) return whatsapp.sendTextMessage(phone, 'That email address does not appear to be valid.\n\nPlease enter it again.\nExample: customer@example.com');
    session.data.email = input;
    session.stage = stages.WAITING_FOR_SERVICE;
    return whatsapp.sendServiceMenu(phone);
  }
  if (session.stage === stages.WAITING_FOR_ADDRESS) {
    if (!validAddress(input)) return whatsapp.sendTextMessage(phone, 'Please provide a more complete pickup address.');
    session.data.pickupAddress = input;
    session.stage = stages.WAITING_FOR_CONTACT_METHOD;
    return whatsapp.sendContactMethodMenu(phone);
  }
  return whatsapp.sendTextMessage(phone, 'Please use one of the available options or type MENU.');
}

async function processIncoming(message) {
  if (message.replyId) return handleAction(message.phoneNumber, message.replyId);
  if (message.type === 'text') return handleText(message.phoneNumber, message.text);
  return whatsapp.sendTextMessage(message.phoneNumber, 'Sorry, I can currently help with text messages and menu selections. Type MENU to begin.');
}

module.exports = { processIncoming, handleText, handleAction };
