import type { NavGroup } from '@/types/sidebar';

export function filterNavGroupsByPermission(
  groups: NavGroup[],
  has: (permission: string) => boolean,
): NavGroup[] {
  const canView = (permission?: string) => !permission || has(permission);

  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canView(item.permission))
        .map((item) => ({
          ...item,
          subItems: item.subItems.filter((sub) => canView(sub.permission)),
        })),
    }))
    .filter((group) => group.items.length > 0);
}
