import { describe, expect, it } from 'vitest'
import { filterNavGroupsByPermission } from '@/lib/nav-permissions'
import type { NavGroup } from '@/types/sidebar'

const icon = (() => null) as never

function buildGroups(): NavGroup[] {
  return [
    {
      title: 'General',
      items: [
        {
          id: 'home',
          path: '/',
          label: 'Home',
          labelAlt: 'H',
          icon,
          badge: null,
          subItems: [],
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          id: 'records',
          path: '/records',
          label: 'Records',
          labelAlt: 'R',
          icon,
          badge: null,
          permission: 'pokemon:read',
          subItems: [
            {
              id: 'records-create',
              path: '/records/new',
              label: 'New',
              labelAlt: 'N',
              icon,
              permission: 'user:create',
            },
          ],
        },
        {
          id: 'admin',
          path: '/admin',
          label: 'Admin',
          labelAlt: 'A',
          icon,
          badge: null,
          permission: 'user:list',
          subItems: [],
        },
      ],
    },
    {
      title: 'Sessions',
      items: [
        {
          id: 'sessions',
          path: '/sessions',
          label: 'Sessions',
          labelAlt: 'S',
          icon,
          badge: null,
          permission: 'session:revoke',
          subItems: [],
        },
      ],
    },
  ]
}

function itemIds(groups: NavGroup[]): string[] {
  return groups.flatMap((group) => group.items).map((item) => item.id)
}

describe('filterNavGroupsByPermission', () => {
  it('keeps every item for a user with all permissions', () => {
    const result = filterNavGroupsByPermission(buildGroups(), () => true)

    expect(itemIds(result)).toEqual(['home', 'records', 'admin', 'sessions'])
  })

  it('hides inaccessible items, keeps unguarded items, and prunes sub-items', () => {
    const has = (permission: string) => permission === 'pokemon:read'

    const result = filterNavGroupsByPermission(buildGroups(), has)

    expect(itemIds(result)).toEqual(['home', 'records'])
    const records = result
      .flatMap((group) => group.items)
      .find((item) => item.id === 'records')
    expect(records?.subItems).toHaveLength(0)
  })

  it('drops a group whose items are all hidden', () => {
    const result = filterNavGroupsByPermission(buildGroups(), () => false)

    expect(itemIds(result)).toEqual(['home'])
  })
})
