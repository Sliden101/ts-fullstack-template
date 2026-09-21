import type { LucideIcon } from 'lucide-react';

export type SidebarLanguage = 'en' | 'km';

export interface SubNavItem {
  id: string;
  path: string;
  label: string;
  labelAlt: string;
  icon: LucideIcon;
  permission?: string;
}

export interface NavItem {
  id: string;
  path: string;
  label: string;
  labelAlt: string;
  icon: LucideIcon;
  badge: string | null;
  isHighlight?: boolean;
  permission?: string;
  subItems: SubNavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface SidebarProps {
  language?: SidebarLanguage;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onNavigateToRoute?: (path: string) => void;
}
