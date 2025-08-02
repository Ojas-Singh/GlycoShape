export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  institution?: string;
  user_type: 'academic' | 'industry';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  institution?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: 'active' | 'cancelled' | 'pending' | 'expired';
  created_at: string;
  expires_at?: string;
  auto_renew: boolean;
  billing_cycle?: 'monthly' | 'yearly';
}

export interface SubscriptionPlan {
  plan_type: string;
  name: string;
  description: string;
  features: string[];
  price_academic?: number;
  price_industry?: number;
  billing_cycle?: 'monthly' | 'yearly';
  is_free: boolean;
}

export interface License {
  id: string;
  license_key: string;
  license_type: 'academic_perpetual' | 'industry_onsite';
  user_id: string;
  tools: string[];
  max_activations: number;
  current_activations: number;
  expires_at?: string;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
  machine_fingerprints: string[];
}

export interface APIKey {
  id: string;
  user_id: string;
  key_name: string;
  pricing_tier: 'free' | 'pay_per_use' | 'unlimited';
  credits_remaining?: number;
  rate_limit_per_minute: number;
  allowed_endpoints: string[];
  status: 'active' | 'revoked';
  created_at: string;
  last_used_at?: string;
  usage_count: number;
}

export interface UsageSummary {
  total_api_requests: number;
  api_requests_last_30_days: number;
  credits_consumed: number;
  active_licenses: number;
  active_api_keys: number;
}

export interface UsageLog {
  id: string;
  timestamp: string;
  endpoint: string;
  credits_used: number;
  status: string;
}

export interface ApiError {
  message: string;
  details?: string;
  field?: string;
}
