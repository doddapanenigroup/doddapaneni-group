import NextAuth from 'next-auth';
import authConfig from './auth.config';

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

const nextAuth = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
});

/** Use `await auth()` in Server Components, Route Handlers, and server actions. */
export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
