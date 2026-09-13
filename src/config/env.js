const requiredMetaKeys = ['VERIFY_TOKEN', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID'];
const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  verifyToken: process.env.VERIFY_TOKEN,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  graphApiVersion: process.env.GRAPH_API_VERSION || 'v25.0'
};
function missingMetaConfig() { return requiredMetaKeys.filter((key) => !process.env[key]); }
function hasMetaConfig() { return missingMetaConfig().length === 0; }
function assertStartupConfig() {
  const missing = missingMetaConfig();
  const allowsMissingMetaConfig = ['development', 'test'].includes(env.nodeEnv);
  if (!allowsMissingMetaConfig && missing.length) {
    throw new Error(`Missing required Meta configuration: ${missing.join(', ')}. Set these environment variables before starting ${env.nodeEnv}.`);
  }
  if (missing.length && env.nodeEnv === 'development') console.warn(`Meta integration is not configured (${missing.join(', ')}). Local routes remain available; outbound WhatsApp sends will fail safely.`);
}
module.exports = { env, hasMetaConfig, missingMetaConfig, assertStartupConfig };
