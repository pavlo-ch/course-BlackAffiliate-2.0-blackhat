export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  access_level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  created_at: string;
  lastLogin?: Date;
  isApproved: boolean;
  last_seen?: string;
  is_active?: boolean;
  payment_reminder?: string | null;
  overdue_message?: string | null;
  expired_message?: string | null;
  access_expires_at?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface RegistrationRequest {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AccessLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AccessLevelInfo {
  level: AccessLevel;
  name: string;
}

export const ACCESS_LEVELS: Record<AccessLevel, AccessLevelInfo> = {
  1: {
    level: 1,
    name: 'Basic'
  },
  2: {
    level: 2,
    name: 'Premium'
  },
  3: {
    level: 3,
    name: 'VIP'
  },
  4: {
    level: 4,
    name: 'Without Road Map'
  },
  5: {
    level: 5,
    name: 'Blocked'
  },
  6: {
    level: 6,
    name: 'Creative Push Only'
  },
  7: {
    level: 7,
    name: 'Payment Overdue'
  }
};

export interface AuthContextType extends AuthState {
  isInitializing: boolean;
  loadingStage: string;
  retryCount: number;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string; isPending?: boolean; requestId?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
  hasAccess: (requiredLevel: AccessLevel, lessonId?: string) => boolean;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  getRegistrationRequests: () => RegistrationRequest[];
  loadRegistrationRequests: () => Promise<void>;
  rejectRegistration: (requestId: string) => Promise<boolean>;
  remindAdmin: (requestId: string) => Promise<{ success: boolean; message: string }>;
}