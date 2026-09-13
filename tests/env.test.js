const META_KEYS = ['VERIFY_TOKEN', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID'];

describe('startup configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    META_KEYS.forEach((key) => delete process.env[key]);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test.each(['development', 'test'])('allows missing Meta credentials in %s', (nodeEnv) => {
    process.env.NODE_ENV = nodeEnv;
    const { assertStartupConfig } = require('../src/config/env');
    expect(() => assertStartupConfig()).not.toThrow();
  });

  test.each(['production', 'staging'])('rejects missing Meta credentials in %s', (nodeEnv) => {
    process.env.NODE_ENV = nodeEnv;
    const { assertStartupConfig } = require('../src/config/env');
    expect(() => assertStartupConfig()).toThrow(/Missing required Meta configuration:.*VERIFY_TOKEN.*WHATSAPP_ACCESS_TOKEN/);
  });

  test('accepts production startup when all required Meta credentials exist', () => {
    process.env.NODE_ENV = 'production';
    META_KEYS.forEach((key) => { process.env[key] = `configured-${key}`; });
    const { assertStartupConfig } = require('../src/config/env');
    expect(() => assertStartupConfig()).not.toThrow();
  });
});
