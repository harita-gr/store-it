"use server"; //only server-side code can use this directive

import { Client, Account, Databases, Avatars, Storage } from "node-appwrite";
import { appwriteConfig } from "./config";
import { cookies } from "next/headers";

//client for session management
export const createSessionClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId);

  const session = ((await cookies()).get("appwrite-session") || {}).value;

  if (!session) {
    throw new Error("No session found. Please log in.");
  }

  client.setSession(session);

  return {
    get account() {
      //create an account instance for session management
      return new Account(client);
    },
    get databases() {
      //create a databases instance for session management
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get avatars() {
      return new Avatars(client);
    },
  };
};

//client for admin operations
export const createAdminClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey);

  return {
    //create an account instance for admin operations
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
    get avatars() {
      return new Avatars(client);
    },
  };
};
