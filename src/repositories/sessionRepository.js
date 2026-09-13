const sessions = new Map();
const processedMessageIds = new Set();
const supportRequests = [];
function create(phoneNumber) { const session = { phoneNumber, stage: null, data: { name: null, email: null, preferredService: null, pickupAddress: null, preferredContactMethod: null, consentGiven: false } }; sessions.set(phoneNumber, session); return session; }
function get(phoneNumber) { return sessions.get(phoneNumber); }
function remove(phoneNumber) { sessions.delete(phoneNumber); }
function isProcessed(id) { return processedMessageIds.has(id); }
function markProcessed(id) { processedMessageIds.add(id); }
function addSupportRequest(phoneNumber) { supportRequests.push({ phoneNumber, createdAt: new Date().toISOString() }); }
function clear() { sessions.clear(); processedMessageIds.clear(); supportRequests.length = 0; }
module.exports = { create, get, remove, isProcessed, markProcessed, addSupportRequest, clear };
