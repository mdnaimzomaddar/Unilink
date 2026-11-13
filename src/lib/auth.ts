import "./dns-fix";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const globalForMongo = global as unknown as { _authClient?: MongoClient };
const client =
  globalForMongo._authClient ?? new MongoClient(process.env.MONGODB_URI as string);
globalForMongo._authClient = client;

const db = client.db("unilink");

// const isUniversityEmail = (email: string) =>
//   /\.(ac|edu)\.bd$/i.test(email.split("@")[1] ?? "");

export const auth = betterAuth({
    appName: "Unilink",
  database: mongodbAdapter(db),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true, // signup-এর পর নিজে থেকেই login
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "student", input: false },
      university: { type: "string", defaultValue: "default", input: false },
      isUniversityVerified: { type: "boolean", defaultValue: false, input: false },
      isFacultyApproved: { type: "boolean", defaultValue: false, input: false },
      department: { type: "string", required: false },
      bio: { type: "string", required: false },
    },
  },
  // databaseHooks: {
  //   user: {
  //     create: {
  //       before: async (user) => ({
  //         data: { ...user, isUniversityVerified: isUniversityEmail(user.email) },
  //       }),
  //     },
  //   },
  // },
});

export type Session = typeof auth.$Infer.Session;