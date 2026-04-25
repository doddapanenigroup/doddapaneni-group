import { handlers } from '@/lib/auth';

// Export handlers directly - NextAuth v5 handles errors internally
export const { GET, POST } = handlers;
