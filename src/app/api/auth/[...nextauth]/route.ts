import NextAuth, { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongoClient";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import User, { IUser } from "@/models/User";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Please enter an email and password");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials");
        }

        return user;
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const u = user as IUser;
        token.role = u.role;
        token.id = u.id as string;
      }
      return token;
    },

    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.role = token.role as "user" | "admin";
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // ----- THIS IS THE MODIFIED LINE -----
  pages: { signIn: "/login" }, // Updated from "/[locale]/login" to "/login"
  // ------------------------------------

  secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
