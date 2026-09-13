const request = require('supertest');
const app = require('../src/app');
const customers = require('../src/repositories/customerRepository');
const sessions = require('../src/repositories/sessionRepository');

describe('application and customer routes', () => {
  beforeEach(() => {
    customers.clear();
    sessions.clear();
  });

  test('GET / returns the application status', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Cloud Laundry WhatsApp API is running' });
  });

  test('GET /health returns a timestamped health response', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, status: 'ok' });
    expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
  });

  test('GET /api/customers lists records and GET by ID returns one record', async () => {
    const customer = customers.save({ whatsappNumber: '94770000001', name: 'Nimal Perera' });
    const list = await request(app).get('/api/customers');
    expect(list.status).toBe(200);
    expect(list.body).toEqual({ success: true, data: [customer] });
    const detail = await request(app).get(`/api/customers/${customer.customerId}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toEqual({ success: true, data: customer });
  });

  test('GET /api/customers/:customerId returns 404 for an unknown customer', async () => {
    const response = await request(app).get('/api/customers/CUS-2000-999');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, message: 'Customer not found' });
  });

  test('DELETE /api/demo-data clears customers, sessions, and processed message IDs', async () => {
    customers.save({ whatsappNumber: '94770000001', name: 'Nimal Perera' });
    sessions.create('94770000001');
    sessions.markProcessed('message-1');
    const response = await request(app).delete('/api/demo-data');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Demo data cleared' });
    expect(customers.all()).toEqual([]);
    expect(sessions.get('94770000001')).toBeUndefined();
    expect(sessions.isProcessed('message-1')).toBe(false);
  });

  test('Helmet and CORS headers are enabled', async () => {
    const response = await request(app).get('/health').set('Origin', 'https://example.test');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['access-control-allow-origin']).toBe('https://example.test');
  });

  test('JSON request bodies over 100kb are rejected by centralized safe error handling', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).post('/webhook').send({ oversized: 'x'.repeat(101 * 1024) });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({ success: false, message: 'Internal server error' });
    expect(errorSpy).toHaveBeenCalledWith('[express] PayloadTooLargeError');
    errorSpy.mockRestore();
  });
});
