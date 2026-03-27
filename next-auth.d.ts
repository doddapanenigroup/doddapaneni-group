import type { DefaultSession } from 'next-auth';
import type { Role } from '@/lib/constants';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      sessionIssuedAt?: number;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    sessionIssuedAt?: number;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
