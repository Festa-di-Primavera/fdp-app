import { generateId } from "lucia";

export const verifyPasswordResetToken = async (tokenId: string) => {
	const [passwordResetToken] = await database
		.select()
		.from(passwordResetTokensTable)
		.where(eq(passwordResetTokensTable.id, tokenId));

	if (!passwordResetToken || passwordResetToken.id !== tokenId) {
		return {
			success: false,
			message: 'The password reset link is invalid. Please request a new one.'
		};
	}

	if (!isWithinExpirationDate(passwordResetToken.expiresAt)) {
		return {
			success: false,
			message: 'The password reset link has expired. Please request a new one.'
		};
	}

	return {
		success: true,
		userId: passwordResetToken.userId,
		message: 'Password reset token is valid.'
	};
};

export const generatePasswordResetToken = async (userId: string) => {
	const tokenId = generateId(40);

	await database.transaction(async (trx) => {
		await trx.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, userId));

		await trx.insert(passwordResetTokensTable).values({
			id: tokenId,
			userId,
			expiresAt: createDate(new TimeSpan(15, 'm')) // 15 minutes
		});
	});

	return tokenId;
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
	const htmlContent = `
	<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
		<h1>Password Reset Request</h1>
		<p>We've received a request to reset your password. If you didn't make the request, just ignore this email. Otherwise, you can reset your password using the link below.</p>

		<p>
		<a href="http://localhost:5173${route('/auth/reset-password')}?token=${resetToken}" style="color: #337ab7; text-decoration: none;">Reset your password</a>
		</p>

		<p>If you need help or have any questions, please contact our support team. We're here to help!</p>
	</div>
	`;

	return sendEmail({
		email,
		subject: 'Password Reset Request',
		htmlContent
	});
};