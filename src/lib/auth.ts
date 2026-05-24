import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Pool } from "@neondatabase/serverless";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 60},
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

          // Cada login fresco resetea twoFactorVerified en DB

          return {
            id:               user.id,
            name:             user.name,
            email:            user.email,
            role:             user.role,
            twoFactorEnabled: user.twoFactorEnabled,
          };
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
        token.id                = user.id;
        token.role              = (user as any).role;
        token.twoFactorEnabled  = (user as any).twoFactorEnabled;
        token.twoFactorVerified = false;
      }
      if (trigger === "update" && session?.twoFactorVerified === true) {
        token.twoFactorVerified = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id                = token.id;
        (session.user as any).role              = token.role;
        (session.user as any).twoFactorEnabled  = token.twoFactorEnabled;
        (session.user as any).twoFactorVerified = token.twoFactorVerified;
      }
      return session;
    },
  },
};