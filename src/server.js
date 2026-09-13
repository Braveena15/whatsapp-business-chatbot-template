require('dotenv').config();
const app = require('./app'); const { env, assertStartupConfig } = require('./config/env');
const businessConfig = require('./config/businessConfig');
assertStartupConfig(); app.listen(env.port, () => console.log(`${businessConfig.businessName} WhatsApp API listening on port ${env.port}`));
