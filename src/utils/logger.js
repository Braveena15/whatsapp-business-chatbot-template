function safeError(context, error) {
  const status = error && error.response && error.response.status;
  const errorName = error && typeof error.name === 'string' ? error.name : 'Error';
  console.error(`[${context}] ${status ? `HTTP ${status}` : errorName}`);
}
function info(message) { console.log(`[${businessConfig.businessName}] ${message}`); }
module.exports = { safeError, info };
const businessConfig = require('../config/businessConfig');
