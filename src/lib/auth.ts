import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Pool } from "@neondatabase/serverless";

interface ExtendedUser extends User {
  role: string;
  twoFactorEnabled: boolean;
}

interface ExtendedToken extends JWT {
  id: string;
  role: string;
  twoFactorEnabled: boolean;
  twoFactorVerified: boolean;
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    role: string;
    twoFactorEnabled: boolean;
    twoFactorVerified: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",      type: "email"    },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const pool = new Pool({ connectionString: process.env.DATABASE_URL });
          const result = await pool.query(
            `SELECT * FROM "User" WHERE email = $1 AND active = true LIMIT 1`,
            [credentials.email]
          );
          await pool.end();

          const user = result.rows[0];
          if (!user) return null;

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;

          return {
            id:               user.id,
            name:             user.name,
            email:            user.email,
            role:             user.role,
            twoFactorEnabled: user.twoFactorEnabled,
          } as ExtendedUser;
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as ExtendedUser;
        (token as ExtendedToken).id                = u.id as string;
        (token as ExtendedToken).role              = u.role;
        (token as ExtendedToken).twoFactorEnabled  = u.twoFactorEnabled;
        (token as ExtendedToken).twoFactorVerified = false;
      }
      if (trigger === "update" && (session as { twoFactorVerified?: boolean })?.twoFactorVerified === true) {
        (token as ExtendedToken).twoFactorVerified = true;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as ExtendedToken;
      const s = session as ExtendedSession;
      if (s.user) {
        s.user.id                = t.id;
        s.user.role              = t.role;
        s.user.twoFactorEnabled  = t.twoFactorEnabled;
        s.user.twoFactorVerified = t.twoFactorVerified;
      }
      return s;
    },
  },
};
