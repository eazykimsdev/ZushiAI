/**
 * Auth Module Stub
 * 
 * Per Architectural Rule:
 * NO login, NO accounts, NO Discord auth for now. Everything is 100% local.
 * This clean stub isolates auth concerns so license keys or accounts
 * can be plugged in cleanly later without touching core builder logic.
 */

export interface UserProfile {
  id: string;
  username: string;
  tier: 'local-developer' | 'studio' | 'enterprise';
  isLocalOnly: boolean;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: UserProfile;
  licenseKey?: string;
  expiresAt?: string;
}

export const localAuth = {
  getSession(): AuthSession {
    return {
      isAuthenticated: true,
      user: {
        id: 'local-dev',
        username: 'Studio Creator',
        tier: 'studio',
        isLocalOnly: true,
      },
    };
  },

  async validateLicenseKey(_key: string): Promise<{ valid: boolean; message: string }> {
    // Stub for future license key validation
    return {
      valid: true,
      message: 'Local BYOK mode active. All models execute with your own API credentials.',
    };
  },
};
