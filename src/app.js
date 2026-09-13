const express = require('express'); const helmet = require('helmet'); const cors = require('cors');
const webhookRoutes = require('./routes/webhookRoutes'); const customerRoutes = require('./routes/customerRoutes'); const healthRoutes = require('./routes/healthRoutes');
const { safeError } = require('./utils/logger');
const businessConfig = require('./config/businessConfig');
const app = express(); app.use(helmet()); app.use(cors({ origin: true })); app.use(express.json({ limit: '100kb' }));
app.get('/', (req, res) => res.json({ success: true, message: `${businessConfig.businessName} WhatsApp API is running` })); app.use('/health', healthRoutes); app.use('/webhook', webhookRoutes); app.use('/api', customerRoutes);
app.use((err, req, res, next) => { safeError('express', err); res.status(err.status || 500).json({ success: false, message: 'Internal server error' }); });
module.exports = app;
