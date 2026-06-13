const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';

/** Legacy JWT anon key */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

/** New Supabase publishable key (sb_publishable_...) */
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || '';

/** Legacy JWT service role key */
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

/** New Supabase secret key (sb_secret_...) */
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim() || '';

export function isValidJwt(key: string): boolean {
  const parts = key.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function isValidSupabaseKey(key: string): boolean {
  if (!key || key.length < 20) return false;
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_secret_')) return true;
  return isValidJwt(key);
}

/** Client-side / public reads — publishable key preferred, anon key as fallback */
export function getSupabasePublicKey(): string {
  return supabasePublishableKey || supabaseAnonKey;
}

/** Server-side CMS writes — secret key preferred, service role as fallback, then public key */
export function getSupabaseAdminKey(): string {
  return supabaseSecretKey || supabaseServiceRoleKey || getSupabasePublicKey();
}

export function getSupabaseUrl(): string {
  return supabaseUrl;
}

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(supabaseUrl && isValidSupabaseKey(getSupabasePublicKey()));
}

export function getSupabaseEnvStatus(): {
  configured: boolean;
  urlSet: boolean;
  publicKeySet: boolean;
  publicKeyValid: boolean;
  adminKeySet: boolean;
} {
  const publicKey = getSupabasePublicKey();
  const adminKey = getSupabaseAdminKey();

  return {
    configured: isSupabaseEnvConfigured(),
    urlSet: Boolean(supabaseUrl),
    publicKeySet: Boolean(publicKey),
    publicKeyValid: isValidSupabaseKey(publicKey),
    adminKeySet: Boolean(supabaseSecretKey || supabaseServiceRoleKey),
  };
}

export function getSupabaseConfigError(): string | null {
  const status = getSupabaseEnvStatus();

  if (!status.urlSet) {
    return 'NEXT_PUBLIC_SUPABASE_URL is missing in .env.local';
  }

  if (!status.publicKeySet) {
    return 'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local';
  }

  if (!status.publicKeyValid) {
    return 'Supabase public key is invalid. Use sb_publishable_... or a full JWT anon key from Supabase → Project Settings → API';
  }

  return null;
}
