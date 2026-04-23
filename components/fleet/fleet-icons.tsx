import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const fleetNavIcons: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  employees: Users,
  policies: ShieldCheck,
  billing: ReceiptText,
  reports: BarChart3,
  audit: ClipboardList,
  hub: Building2,
  logout: LogOut,
};
