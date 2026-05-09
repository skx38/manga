import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const providers: NextAuthOptions['providers'] = [];

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    providers.push(
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
        })
    );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    );
}

providers.push(
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials.password) return null;
            const user = await prisma.user.findUnique({
                where: { email: credentials.email },
            });
            if (!user?.passwordHash) return null;
            const ok = await compare(credentials.password, user.passwordHash);
            if (!ok) return null;
            return {
                id: user.id,
                email: user.email ?? undefined,
                name: user.name ?? user.username ?? undefined,
                image: user.image ?? undefined,
            };
        },
    })
);

export const authOptions: NextAuthOptions = {
    // PrismaAdapter is used for OAuth account linking. Credentials provider runs
    // through the JWT path regardless of adapter.
    adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
    providers,
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/auth/sign-in',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) token.id = user.id;
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                (session.user as { id?: string }).id = token.id as string;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
