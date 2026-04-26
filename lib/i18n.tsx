'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { T1 } from './i18n-t1';
import { T2 } from './i18n-t2';
import { T3 } from './i18n-t3';

export const TAPPY_LANGS = [
  { code: 'en', name: 'English',     flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch',     flag: '🇩🇪' },
  { code: 'fr', name: 'Français',    flag: '🇫🇷' },
  { code: 'es', name: 'Español',     flag: '🇪🇸' },
  { code: 'it', name: 'Italiano',    flag: '🇮🇹' },
  { code: 'pt', name: 'Português',   flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands',  flag: '🇳🇱' },
  { code: 'pl', name: 'Polski',      flag: '🇵🇱' },
  { code: 'sv', name: 'Svenska',     flag: '🇸🇪' },
  { code: 'da', name: 'Dansk',       flag: '🇩🇰' },
  { code: 'no', name: 'Norsk',       flag: '🇳🇴' },
  { code: 'fi', name: 'Suomi',       flag: '🇫🇮' },
  { code: 'cs', name: 'Čeština',     flag: '🇨🇿' },
  { code: 'sk', name: 'Slovenčina',  flag: '🇸🇰' },
  { code: 'hu', name: 'Magyar',      flag: '🇭🇺' },
  { code: 'ro', name: 'Română',      flag: '🇷🇴' },
  { code: 'bg', name: 'Български',   flag: '🇧🇬' },
  { code: 'hr', name: 'Hrvatski',    flag: '🇭🇷' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'et', name: 'Eesti',       flag: '🇪🇪' },
  { code: 'lv', name: 'Latviešu',    flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių',    flag: '🇱🇹' },
  { code: 'el', name: 'Ελληνικά',    flag: '🇬🇷' },
  { code: 'tr', name: 'Türkçe',      flag: '🇹🇷' },
  { code: 'uk', name: 'Українська',  flag: '🇺🇦' },
  { code: 'ca', name: 'Català',      flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
] as const;

const TRANSLATIONS: Record<string, Record<string, string>> = { ...T1, ...T2, ...T3 };

// Maps keys used in components to keys in the translation files.
// Avoids duplicating ~90 keys across 26 language dicts.
const KEY_ALIASES: Record<string, string> = {
  // Common
  network_error:            'err_network',
  not_set:                  'val_not_set',
  // Sidebar
  nav_audit_log:            'nav_audit',
  nav_sign_out:             'btn_sign_out',
  switch_org:               'label_switch_org',
  // Org hub
  hub_eyebrow:              'fleet_workspace',
  hub_no_orgs_title:        'no_orgs_title',
  hub_no_orgs_member:       'no_orgs_member',
  hub_no_orgs_empty:        'no_orgs_create',
  hub_open_fleet:           'btn_open_fleet',
  hub_manage_details:       'btn_manage_details',
  hub_manage_modal_title:   'modal_manage_org',
  org_save_error:           'err_update_org',
  payment_company:          'opt_company_paid',
  payment_reimbursable:     'opt_employee_reimbursable',
  field_company_name:       'label_company_name',
  field_legal_name:         'label_legal_name',
  field_billing_email:      'label_billing_email',
  field_vat:                'label_vat_number',
  field_city:               'label_city',
  field_country:            'label_country',
  field_address:            'label_address',
  field_payment_mode:       'label_payment_mode',
  // Create org modal
  create_org_btn:           'btn_create_org',
  create_org_title:         'modal_create_org',
  create_org_creating:      'btn_creating',
  create_org_submit:        'btn_create',
  create_org_error:         'err_create_org',
  // Employees
  emp_col_name:             'col_name',
  emp_col_email:            'col_email',
  emp_col_role:             'col_role',
  emp_col_status:           'col_status',
  emp_col_actions:          'col_actions',
  emp_empty:                'no_members',
  emp_invite_btn:           'btn_invite_member',
  emp_invite_title:         'modal_invite_member',
  emp_invite_send:          'btn_send_invite',
  emp_invite_sending:       'btn_sending',
  emp_activate:             'btn_activate',
  emp_suspend:              'btn_suspend',
  emp_remove:               'btn_remove',
  emp_confirm_remove:       'confirm_remove_member',
  emp_action_failed:        'err_save_failed',
  emp_resend_failed:        'err_invite_failed',
  invite_failed:            'err_invite_failed',
  // Billing
  billing_title:            'page_billing',
  billing_subtitle:         'billing_auto_note',
  billing_col_period:       'col_period',
  billing_col_amount:       'col_amount',
  billing_col_sessions:     'col_sessions',
  billing_col_actions:      'col_actions',
  billing_col_status:       'col_status',
  billing_download_pdf:     'btn_download_pdf',
  billing_downloading:      'btn_downloading',
  billing_empty:            'no_invoices',
  // Reports
  reports_title:            'page_reports',
  reports_export_csv:       'btn_export_csv',
  reports_exporting:        'btn_exporting',
  reports_from:             'label_from',
  reports_to:               'label_to',
  reports_apply:            'btn_apply',
  reports_sessions_total:   'sessions_total_plural',
  reports_col_employee:     'col_employee',
  reports_col_station:      'col_station',
  reports_col_date:         'col_date',
  reports_col_kwh:          'col_kwh',
  reports_col_cost:         'col_cost',
  reports_col_billing:      'col_billing',
  reports_empty:            'no_sessions',
  // Policies
  policies_title:           'page_policies',
  policy_new_btn:           'btn_new_policy',
  policy_business_days:     'policy_biz_days',
  policy_ac_only_label:     'chk_ac_only',
  policy_business_days_label: 'chk_biz_days',
  policy_any_time:          'opt_any_time',
  policy_new_title:         'modal_new_policy',
  policy_edit_title:        'modal_edit_policy',
  policy_name_label:        'label_policy_name',
  policy_max_session:       'label_max_per_session',
  policy_max_month:         'label_max_per_month',
  policy_hours_from:        'label_allowed_from',
  policy_hours_until:       'label_allowed_until',
  policy_hours_pair_required: 'err_policy_hours_pair_required',
  policy_save_failed:       'err_save_failed',
  policies_empty:           'no_policies',
  policy_enforcement_label: 'label_enforcement',
  policy_soft_option:       'opt_soft_policy',
  policy_mandatory_option:  'opt_mandatory_policy',
  policy_mandatory_badge:   'badge_mandatory',
  // Audit
  audit_col_time:           'col_time',
  audit_col_action:         'col_action',
  audit_col_entity:         'col_entity',
  audit_col_by:             'col_by',
  audit_empty:              'no_audit',
  // Login
  login_cta:                'btn_sign_in',
  login_signing_in:         'btn_signing_in',
  login_invalid:            'err_invalid_creds',
  login_no_account:         'no_account',
  login_register_link:      'link_register',
  // Register
  register_cta:             'btn_create_account',
  register_creating:        'btn_creating_account',
  register_failed:          'err_register_failed',
  register_have_account:    'have_account',
  register_signin_link:     'link_register',
  register_name_placeholder: 'placeholder_name',
  register_password_placeholder: 'placeholder_password_min',
  // Accept-invite
  invite_page_title:        'invite_title',
  invite_page_subtitle:     'invite_subtitle',
  invite_accept_btn:        'btn_accept_invite',
  invite_accepting:         'btn_accepting',
  invite_open_app:          'btn_open_app',
  invite_invalid_link:      'err_invalid_invite',
  invite_missing_params:    'err_invalid_link',
};

interface I18nCtx {
  lang: string;
  setLang: (code: string) => void;
}

const Ctx = createContext<I18nCtx>({ lang: 'en', setLang: () => {} });

function detectLang(): string {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('tappy_lang');
  if (saved && TAPPY_LANGS.find((l) => l.code === saved)) return saved;
  const browser = (navigator.language || '').split('-')[0].toLowerCase();
  return TAPPY_LANGS.find((l) => l.code === browser) ? browser : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>('en');

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((code: string) => {
    if (!TAPPY_LANGS.find((l) => l.code === code)) return;
    localStorage.setItem('tappy_lang', code);
    document.documentElement.lang = code;
    setLangState(code);
  }, []);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}

export function useT() {
  const { lang } = useContext(Ctx);
  return useCallback(
    (key: string): string => {
      const resolved = KEY_ALIASES[key] ?? key;
      const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en ?? {};
      return (dict[resolved] ?? TRANSLATIONS.en?.[resolved] ?? key);
    },
    [lang],
  );
}
