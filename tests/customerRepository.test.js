const customers = require('../src/repositories/customerRepository');

describe('customer repository', () => {
  beforeEach(() => customers.clear());

  test('generates CUS-YYYY-### customer references', () => {
    const customer = customers.save({ whatsappNumber: '94770000001', name: 'Nimal Perera' });
    expect(customer.customerId).toMatch(new RegExp(`^CUS-${new Date().getFullYear()}-001$`));
  });

  test('updates a duplicate WhatsApp number while preserving identity and creation time', () => {
    const original = customers.save({ whatsappNumber: '94770000001', name: 'Original Name' });
    const updated = customers.save({ whatsappNumber: '94770000001', name: 'Updated Name' });
    expect(customers.all()).toHaveLength(1);
    expect(updated).toMatchObject({
      customerId: original.customerId,
      createdAt: original.createdAt,
      whatsappNumber: '94770000001',
      name: 'Updated Name'
    });
  });
});
