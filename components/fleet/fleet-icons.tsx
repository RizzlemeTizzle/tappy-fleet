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
  WalletCards,
} from 'lucide-react';

export const fleetNavIcons: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  employees: Users,
  policies: ShieldCheck,
  billing: ReceiptText,
  reimbursements: WalletCards,
  reports: BarChart3,
  audit: ClipboardList,
  hub: Building2,
  logout: LogOut,
};
