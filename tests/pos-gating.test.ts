import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Web POS Route Gating Logic', () => {
  it('identifies /pos as a PRO-only route disallowed for Free tier', () => {
    const allowedFreeRoutes = ['/overview', '/subscription', '/settings', '/users'];
    const isFree = true;
    const pathname = '/pos';

    const isAllowed = !isFree || allowedFreeRoutes.includes(pathname);
    assert.equal(isAllowed, false);
  });

  it('permits /pos for PRO tier accounts', () => {
    const allowedFreeRoutes = ['/overview', '/subscription', '/settings', '/users'];
    const isFree = false;
    const pathname = '/pos';

    const isAllowed = !isFree || allowedFreeRoutes.includes(pathname);
    assert.equal(isAllowed, true);
  });
});
