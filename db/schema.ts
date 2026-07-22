export const dealerUsersTable = "dealer_users";
export const dealerSessionsTable = "dealer_sessions";
export const dealerQuotesTable = "dealer_quotes";

export interface DealerUserRecord {
  id: string;
  username: string;
  display_name: string;
  role: "admin" | "dealer";
  active: 0 | 1;
  must_change_password: 0 | 1;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface DealerQuoteRecord {
  id: string;
  user_id: string;
  dealer_name: string;
  title: string;
  project_name: string;
  city: string;
  quote_date: string;
  line_count: number;
  total_net_area: number;
  total_billable_area: number;
  total_cents: number;
  draft_json: string;
  totals_json: string;
  created_at: string;
  updated_at: string;
}
