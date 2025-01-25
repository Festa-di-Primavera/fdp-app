export type ActionData = {
    mode: "resetPassword" | "verifyEmail" | "recoverEmail" | null;
    status: number;
    email?: string;
    url?: string;
    actionCode?: string;
};