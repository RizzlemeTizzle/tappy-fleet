export const qk = {
  fleetCompany: (companyId: string) => ['fleet', 'company', companyId] as const,
  fleetMembers: (companyId: string) => ['fleet', 'members', companyId] as const,
  fleetPolicies: (companyId: string) => ['fleet', 'policies', companyId] as const,
  fleetInvoices: (companyId: string) => ['fleet', 'invoices', companyId] as const,
  fleetSessions: (companyId: string, params?: object) => ['fleet', 'sessions', companyId, params] as const,
  fleetOverview: (companyId: string) => ['fleet', 'overview', companyId] as const,
  fleetAuditLog: (companyId: string) => ['fleet', 'audit', companyId] as const,
  myMemberships: () => ['fleet', 'mine'] as const,
};
