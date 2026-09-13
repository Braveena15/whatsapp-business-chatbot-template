const customers = require('../repositories/customerRepository');
const sessions = require('../repositories/sessionRepository');
function list(req, res) { res.json({ success: true, data: customers.all() }); }
function get(req, res) { const customer = customers.get(req.params.customerId); if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' }); return res.json({ success: true, data: customer }); }
function reset(req, res) { customers.clear(); sessions.clear(); res.json({ success: true, message: 'Demo data cleared' }); }
module.exports = { list, get, reset };
