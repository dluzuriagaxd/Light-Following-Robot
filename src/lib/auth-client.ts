import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // Use relative URL so it works in both dev and production
    baseURL: typeof window !== 'undefined' ? window.location.origin : "http://localhost:4321",
});

export const { signIn, signUp, signOut, useSession } = authClient;
