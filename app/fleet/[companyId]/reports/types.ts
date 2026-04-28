export interface Session {
  session_id: string;
  employee_id?: string;
  employee_name: string;
  employee_email: string;
  station_name: string;
  started_at: string;
  delivered_kwh: number;
  total_cost_cents: number;
  billing_mode: string;
  policy_violation?: string | null;
  cost_center_code?: string;
  department_id?: string | null;
  department_name?: string | null;
  policy_id?: string | null;
  policy_name?: string | null;
}

export interface Member {
  id: string;
  user_name: string | null;
  user_email: string;
  department_id: string | null;
  department_name: string | null;
  policy_id: string | null;
  policy_name: string | null;
}

export interface Policy {
  id: string;
  name: string;
}

export interface ReportFilters {
  from: string;
  to: string;
  employeeId: string;
  department: string;
  billingMode: string;
  policyId: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: ReportFilters;
  createdAt: string;
}

export interface ExportSchedule {
  id: string;
  name: string;
  filters: ReportFilters;
  recipientEmail: string;
  frequency: 'weekly' | 'monthly';
  createdAt: string;
}

export interface EnrichedSession extends Session {
  resolved_employee_id: string;
  resolved_department: string;
  resolved_policy_id: string;
  resolved_policy_name: string;
}

export const BILLING_MODE_OPTIONS = [
  { value: '', label: 'All billing modes' },
  { value: 'COMPANY_PAID', label: 'Company paid' },
  { value: 'EMPLOYEE_REIMBURSABLE', label: 'Employee reimbursable' },
];
