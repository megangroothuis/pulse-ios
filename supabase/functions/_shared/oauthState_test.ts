import { assert, assertEquals, assertFalse, assertRejects } from '@std/assert';
import { isAllowedReturnTo, signState, verifyState } from './oauthState.ts';

const state = { userId: 'u1', provider: 'spotify' as const, returnTo: 'pulse://connected', exp: 2_000_000_000 };

Deno.test('state round-trips', async () => {
  const token = await signState(state, 's3cret');
  assertEquals(await verifyState(token, 's3cret', 0), state);
});

Deno.test('tampered or wrongly-signed state is rejected', async () => {
  const token = await signState(state, 's3cret');
  await assertRejects(() => verifyState(token, 'other', 0));
  const forged = await signState({ ...state, userId: 'attacker' }, 'guess');
  const [body] = forged.split('.');
  await assertRejects(() => verifyState(`${body}.${token.split('.')[1]}`, 's3cret', 0));
});

Deno.test('expired state is rejected', async () => {
  const token = await signState({ ...state, exp: 100 }, 's3cret');
  await assertRejects(() => verifyState(token, 's3cret', 101_000), Error, 'expired');
});

Deno.test('returnTo allow-list', () => {
  const allow = ['pulse', 'http://localhost:8081', 'https://app.example.com/'];
  assert(isAllowedReturnTo('pulse://connected', allow));
  assert(isAllowedReturnTo('http://localhost:8081/connected', allow));
  assert(isAllowedReturnTo('https://app.example.com/x', allow));
  assertFalse(isAllowedReturnTo('http://localhost:8081.evil.com/', allow));
  assertFalse(isAllowedReturnTo('https://evil.com/?pulse://', allow));
  assertFalse(isAllowedReturnTo('javascript:alert(1)', allow));
  assertFalse(isAllowedReturnTo('not a url', allow));
});
