function validName(value) { const v = String(value || '').trim(); return v.length >= 2 && v.length <= 100 && /[A-Za-z]/.test(v); }
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || '').trim()); }
function validAddress(value) { const v = String(value || '').trim(); return v.length >= 5 && v.length <= 300; }
module.exports = { validName, validEmail, validAddress };
