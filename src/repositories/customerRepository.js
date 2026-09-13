const customers = new Map();
function nextId() { const year = new Date().getFullYear(); const prefix = `CUS-${year}-`; const count = [...customers.keys()].filter((id) => id.startsWith(prefix)).length + 1; return `${prefix}${String(count).padStart(3, '0')}`; }
function findByWhatsappNumber(whatsappNumber) { return [...customers.values()].find((c) => c.whatsappNumber === whatsappNumber); }
function save(data) { const now = new Date().toISOString(); const current = findByWhatsappNumber(data.whatsappNumber); const customer = { ...data, customerId: current ? current.customerId : nextId(), status: 'Registered', createdAt: current ? current.createdAt : now, updatedAt: now }; customers.set(customer.customerId, customer); return customer; }
function all() { return [...customers.values()]; }
function get(id) { return customers.get(id); }
function clear() { customers.clear(); }
module.exports = { save, all, get, clear };
