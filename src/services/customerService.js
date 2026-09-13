const customers = require('../repositories/customerRepository');
function register(data) { return customers.save(data); }
module.exports = { register };
