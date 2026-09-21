import { createAccessControl } from 'better-auth/plugins/access';

/**
 * RBAC resources and actions. This is the single source of truth for the
 * permission strings (`resource:action`) enforced by server guards and consumed
 * by the client's permission context.
 *
 * Add your application's resources here, then grant them to roles below.
 */
export const statement = {
  user: [
    'create',
    'list',
    'get',
    'update',
    'delete',
    'set-role',
    'set-password',
    'ban',
  ],
  session: ['list', 'revoke', 'delete'],
  pokemon: ['read'],
} as const;

export const DEFAULT_ROLE = 'user';
export const ADMIN_ROLE = 'admin';

export const ac = createAccessControl(statement);

export const roles = {
  admin: ac.newRole({
    user: [
      'create',
      'list',
      'get',
      'update',
      'delete',
      'set-role',
      'set-password',
      'ban',
    ],
    session: ['list', 'revoke', 'delete'],
    pokemon: ['read'],
  }),
  user: ac.newRole({
    pokemon: ['read'],
  }),
} as const;

export type AppRole = keyof typeof roles;

export function parseRoleList(role: string | null | undefined): string[] {
  return (role ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function isKnownRole(role: string): role is AppRole {
  return Object.prototype.hasOwnProperty.call(roles, role);
}

export function permissionsForRoles(role: string | null | undefined): string[] {
  const permissions = new Set<string>();

  for (const entry of parseRoleList(role)) {
    if (!isKnownRole(entry)) {
      continue;
    }
    const definition = roles[entry];
    for (const [resource, actions] of Object.entries(definition.statements)) {
      for (const action of actions) {
        permissions.add(`${resource}:${action}`);
      }
    }
  }

  return [...permissions].sort();
}
