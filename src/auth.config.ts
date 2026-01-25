import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAuth = nextUrl.pathname === '/'; // Login is at root now

            // 1. If on Login Page
            if (isOnAuth) {
                if (isLoggedIn) return Response.redirect(new URL('/ventas', nextUrl));
                return true; // Allow access to Login
            }

            // 2. Allow access to static assets and API auth (handled by middleware matcher usually, but good to be safe)
            // But matcher already excludes them.

            // 3. Block everything else if not logged in
            if (!isLoggedIn) {
                return false; // Redirects to signIn page (/)
            }

            // 4. Role Based Access
            const isOnUsers = nextUrl.pathname.startsWith('/usuarios');
            const isOnConfig = nextUrl.pathname.startsWith('/configuracion');

            if (isOnUsers || isOnConfig) {
                // Cast user to any to access custom fields (or define type)
                const user = auth?.user as any;

                // Only ADMIN can access these routes
                if (user?.rol !== 'ADMIN') {
                    return false; // Redirects to home/login (or we can redirect to /ventas)
                }
                return true;
            }

            return true;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token) {
                session.user.id = token.id;
                session.user.nombre = token.nombre;
                session.user.rol = token.rol;
                session.user.name = token.nombre; // Ensure name is populated for standard components
            }
            return session;
        },
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.id = user.id;
                token.nombre = user.nombre;
                token.rol = user.rol;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
