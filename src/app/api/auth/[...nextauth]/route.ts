// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
// --- Adapter Imports ---
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongoClient";

// --- Provider Imports ---
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// --- Mongoose Imports (for Credentials Provider) ---
import dbConnect from "@/lib/dbConnect";
import User, { IUser } from "@/models/User"; // <-- Import IUser
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: { },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Please enter an email and password');
        }
        
        await dbConnect(); 
        
        const user = await User.findOne({ email: credentials.email }).select('+password');
        
        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error('Invalid credentials');
        }

        // Return the full user object on success
        return user;
      }
    })
  ],
  
  session: { strategy: "jwt" },

  // --- THIS IS THE NEW/UPDATED PART ---
  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    // We want to add the user's role and ID to the token.
    jwt: async ({ token, user }) => {
      if (user) {
        const u = user as IUser; // Cast to our user type
        token.role = u.role;
        token.id = u.id;
      }
      return token;
    },

    // This callback is called whenever a session is checked.
    // We want to add the role and ID from the token to the session object.
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.role = token.role as 'user' | 'admin';
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // --- END OF NEW/UPDATED PART ---

  pages: { signIn: "/login" },
  secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };