export type UserRole = 'admin' | 'supervisor';

interface AdminUserData {
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  lastLoginTime?: Date | null;
}

class AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLoginTime: Date | null;

  constructor({
    id = `user_${Date.now()}`,
    name,
    email,
    role = 'admin',
    lastLoginTime,
  }: AdminUserData) {
    if (!name || !email) {
      throw new Error('name and email are required for an admin user.');
    }

    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.lastLoginTime = lastLoginTime || null;

    this.validate();
  }

  validate() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format.');
    }
  }
}

export default AdminUser;
