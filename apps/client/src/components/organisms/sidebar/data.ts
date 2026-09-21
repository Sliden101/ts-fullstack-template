import { Home, Sparkles } from 'lucide-react';
import type { NavGroup, SidebarLanguage } from '@/types/sidebar';
import { getTranslation } from '@/i18n';

/**
 * The sidebar navigation model. Replace these entries with your application's
 * resources; `permission` values are `resource:action` strings enforced by the
 * server and filtered client-side by `filterNavGroupsByPermission`.
 */
export function getSidebarNavGroups(
  language: SidebarLanguage = 'en',
): NavGroup[] {
  const dict = getTranslation(language);
  const en = getTranslation('en');
  const km = getTranslation('km');

  return [
    {
      title: dict.nav.groups.general,
      items: [
        {
          id: 'dashboard',
          path: '/',
          label: en.nav.items.dashboard,
          labelAlt: km.nav.items.dashboard,
          icon: Home,
          badge: null,
          subItems: [],
        },
      ],
    },
    {
      title: dict.nav.groups.resources,
      items: [
        {
          id: 'pokemon',
          path: '/pokemon',
          label: en.nav.items.pokemon,
          labelAlt: km.nav.items.pokemon,
          icon: Sparkles,
          badge: null,
          permission: 'pokemon:read',
          subItems: [],
        },
      ],
    },
  ];
}
