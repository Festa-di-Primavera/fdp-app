export type ActionData = {
	mode: 'resetPassword' | 'verifyEmail' | 'recoverEmail' | 'verifyAndChangeEmail' | null;
	status: number;
	email?: string;
	url?: string;
	actionCode?: string;
};