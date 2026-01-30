/**
 * Minimal Jest tests for simple client-side validation functions.
 * These tests validate the same rules used in the frontend forms.
 */

function isValidEmail(email){
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

function isValidPassword(p){
  return typeof p === 'string' && p.length >= 6;
}

function isValidAmount(a){
  const n = Number(a);
  return !Number.isNaN(n) && n > 0;
}

test('email validator accepts good email', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});

test('email validator rejects bad email', () => {
  expect(isValidEmail('bad-email')).toBe(false);
});

test('password validator enforces min length', () => {
  expect(isValidPassword('secret')).toBe(true);
  expect(isValidPassword('123')).toBe(false);
});

test('amount validator works', () => {
  expect(isValidAmount('100')).toBe(true);
  expect(isValidAmount('-5')).toBe(false);
  expect(isValidAmount('abc')).toBe(false);
});
