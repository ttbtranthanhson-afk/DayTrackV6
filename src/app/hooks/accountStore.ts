export interface UserData {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  age?: string;
  job?: string;
  habits?: string;
  goals?: string;
  createdAt?: string;
}

const ACCOUNTS_STORAGE_KEY = 'daytrack_accounts';
const CURRENT_USER_STORAGE_KEY = 'daytrack_user_data';
const LAST_EMAIL_STORAGE_KEY = 'daytrack_last_email';

export function getStoredAccounts(): UserData[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && typeof item.email === 'string');
      }
    }
  } catch {
    // ignore parse error
  }
  return [];
}

export function saveAccount(account: UserData): void {
  try {
    const accounts = getStoredAccounts();
    const normalizedEmail = account.email.trim().toLowerCase();
    const index = accounts.findIndex(
      a => a.email.trim().toLowerCase() === normalizedEmail
    );

    const accountWithMeta: UserData = {
      ...account,
      email: normalizedEmail,
      createdAt: account.createdAt || new Date().toISOString(),
    };

    if (index >= 0) {
      accounts[index] = { ...accounts[index], ...accountWithMeta };
    } else {
      accounts.push(accountWithMeta);
    }

    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    setLastEmail(normalizedEmail);
  } catch {
    // ignore storage error
  }
}

export function findAccountByEmail(email: string): UserData | undefined {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return undefined;
  const accounts = getStoredAccounts();
  return accounts.find(a => a.email.trim().toLowerCase() === normalized);
}

export function authenticate(
  email: string,
  password?: string
): { success: boolean; user?: UserData; error?: string } {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: 'Vui lòng nhập địa chỉ email.' };
  }

  const account = findAccountByEmail(normalized);
  if (!account) {
    return {
      success: false,
      error: 'Tài khoản chưa tồn tại. Vui lòng chuyển sang tab "Tạo tài khoản" để đăng ký.',
    };
  }

  // Nếu tài khoản có lưu mật khẩu, kiểm tra mật khẩu
  if (account.password && password !== undefined) {
    if (account.password !== password) {
      return { success: false, error: 'Mật khẩu không chính xác. Vui lòng thử lại.' };
    }
  }

  setLastEmail(normalized);
  return { success: true, user: account };
}

export function updateAccount(email: string, updates: Partial<UserData>): UserData | null {
  try {
    const accounts = getStoredAccounts();
    const normalized = (email || '').trim().toLowerCase();
    const index = accounts.findIndex(a => a.email.trim().toLowerCase() === normalized);

    if (index >= 0) {
      const updated = { ...accounts[index], ...updates };
      accounts[index] = updated;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
      return updated;
    }
  } catch {
    // ignore error
  }
  return null;
}

export function getLastEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastEmail(email: string): void {
  try {
    if (email) {
      localStorage.setItem(LAST_EMAIL_STORAGE_KEY, email.trim().toLowerCase());
    }
  } catch {
    // ignore error
  }
}

export function getCurrentUser(): UserData | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore error
  }
  return null;
}

export function saveCurrentUser(user: UserData | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  } catch {
    // ignore error
  }
}
