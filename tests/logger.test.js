const { safeError } = require('../src/utils/logger');

describe('safe logger', () => {
  test('does not print arbitrary error messages or credentials', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    safeError('test', new Error('secret-access-token'));
    expect(spy).toHaveBeenCalledWith('[test] Error');
    expect(spy.mock.calls.flat().join(' ')).not.toContain('secret-access-token');
    spy.mockRestore();
  });

  test('logs an HTTP status without logging response contents', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    safeError('meta', { response: { status: 401, data: { token: 'secret' } } });
    expect(spy).toHaveBeenCalledWith('[meta] HTTP 401');
    expect(spy.mock.calls.flat().join(' ')).not.toContain('secret');
    spy.mockRestore();
  });
});
