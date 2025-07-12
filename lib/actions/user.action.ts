"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";

//only server-side code can use this directive

// **Create account flow**
//1. Get user email and fullname from the form
//2. Check if user already exists by email
//3. If user exists, send email OTP to the user
//4. If user does not exist, create a new user account with the email and fullname
//5. Send email OTP to the user
//6. Verify the OTP and complete the account creation process
//7. Redirect the user to the dashboard or home page
//8. Handle errors and display appropriate messages

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    [Query.equal("email", [email])]
  );
  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw new Error(message);
};

export const sendEmailOtp = async (email: string) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async ({
  fullname,
  email,
}: {
  fullname: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);
  const accountId = await sendEmailOtp(email);

  if (!accountId) throw new Error("Failed to send an OTP");

  if (!existingUser) {
    const { databases } = await createAdminClient();

    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        fullname,
        email,
        avatar:
          "https://media.istockphoto.com/id/1397922741/vector/default-avatar-like-icon-for-sns.jpg?s=612x612&w=0&k=20&c=kUI4qfHAb0wv4oPoCzcTNlsnV4ezI3Z4TmvEe66-u_c=",
        accountId,
      }
    );
  }

  return parseStringify({ accountId });
};

export const verifyEmailOtp = async ({
  accountId,
  otp,
}: {
  accountId: string;
  otp: string;
}) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createSession(accountId, otp);

    (await cookies()).set("appwrite_session", session.secret, {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: true,
    });

    return parseStringify({
      sessionId: session.$id,
    });
  } catch (error) {
    handleError(error, "Failed to verify email OTP");
  }
};

export const getCurrentUser = async () => {
  try {
    const { account, databases } = await createSessionClient();

    const result = await account.get();

    const user = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", result.$id)]
    );

    if (user.total <= 0) {
      return null;
    }

    return parseStringify(user.documents[0]);
  } catch (error) {
    handleError(error, "Failed to get current user");
  }
};
