export class AuthUser {
  id!: string;
  name!: string;
  email!: string;
  role!: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
}

export class AuthSessionInfo {
  id!: string;
  expiresAt!: Date;
  createdAt!: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  isCurrent!: boolean;
}
