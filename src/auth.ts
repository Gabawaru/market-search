import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import { verifySecret } from "@/lib/auth/password";

export type AppRole = "PARENT" | "TEACHER" | "DEV_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    userId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/parent/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        role: { label: "Rôle", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const role = credentials?.role as AppRole | undefined;
        if (!email || !password || !role) return null;

        if (role === "PARENT") {
          const parent = await prisma.parent.findUnique({ where: { email } });
          if (!parent) return null;
          const valid = await verifySecret(password, parent.passwordHash);
          if (!valid) return null;
          return { id: parent.id, name: parent.name, email: parent.email, role: "PARENT" as const };
        }

        if (role === "TEACHER") {
          const teacher = await prisma.teacher.findUnique({ where: { email } });
          if (!teacher) return null;
          const valid = await verifySecret(password, teacher.passwordHash);
          if (!valid) return null;
          return {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            role: "TEACHER" as const,
          };
        }

        if (role === "DEV_ADMIN") {
          const devAdmin = await prisma.devAdmin.findUnique({ where: { email } });
          if (!devAdmin) return null;
          const valid = await verifySecret(password, devAdmin.passwordHash);
          if (!valid) return null;
          return {
            id: devAdmin.id,
            name: devAdmin.name,
            email: devAdmin.email,
            role: "DEV_ADMIN" as const,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role: AppRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && token.role) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
