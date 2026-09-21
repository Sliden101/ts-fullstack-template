import { describe, expect, it } from 'vitest';
import {
  isKnownRole,
  parseRoleList,
  permissionsForRoles,
  roles,
} from '../../../src/auth/rbac.ts';

describe('roles', () => {
  it('admin allows user:set-role', () => {
    expect(roles.admin.authorize({ user: ['set-role'] })).toEqual({
      success: true,
    });
  });

  it('user denies user:set-role', () => {
    expect(roles.user.authorize({ user: ['set-role'] }).success).toBe(false);
  });

  it('both roles allow pokemon:read', () => {
    expect(roles.admin.authorize({ pokemon: ['read'] })).toEqual({
      success: true,
    });
    expect(roles.user.authorize({ pokemon: ['read'] })).toEqual({
      success: true,
    });
  });
});

describe('parseRoleList', () => {
  it('trims, splits and drops empty entries', () => {
    expect(parseRoleList(' admin , user ,')).toEqual(['admin', 'user']);
  });

  it('returns an empty array for null/undefined', () => {
    expect(parseRoleList(null)).toEqual([]);
    expect(parseRoleList(undefined)).toEqual([]);
  });
});

describe('isKnownRole', () => {
  it('accepts configured roles', () => {
    expect(isKnownRole('admin')).toBe(true);
    expect(isKnownRole('user')).toBe(true);
  });

  it('rejects unknown roles', () => {
    expect(isKnownRole('ghost')).toBe(false);
    expect(isKnownRole('operations')).toBe(false);
  });
});

describe('permissionsForRoles', () => {
  it('expands admin into all permissions, sorted', () => {
    const permissions = permissionsForRoles('admin');

    expect(permissions).toContain('user:set-role');
    expect(permissions).toContain('session:revoke');
    expect(permissions).toContain('pokemon:read');
    expect(permissions).toEqual([...permissions].sort());
  });

  it('grants the user role read access to the example resource', () => {
    expect(permissionsForRoles('user')).toEqual(['pokemon:read']);
  });

  it('unions multiple roles', () => {
    expect(permissionsForRoles('admin,user')).toEqual(
      permissionsForRoles('admin'),
    );
  });

  it('ignores unknown roles', () => {
    expect(permissionsForRoles('ghost')).toEqual([]);
  });
});
