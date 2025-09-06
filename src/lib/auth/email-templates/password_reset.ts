import { DOMAIN } from "$lib/utils/domain";

export function passwordResetTemplate(resetToken: string) {
    return `
		<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
			<h1>Richiesta di reset password</h1>
			<p>Abbiamo ricevuto una richiesta di reset della tua password. Se non hai fatto tu questa richiesta, ignora questa email. Altrimenti, puoi resettare la tua password usando il link qui sotto.</p>

			<p>
			<a href="https://${DOMAIN}/login/password-reset/${resetToken}" style="color: #337ab7; text-decoration: none;">Resetta la tua password</a>
			</p>

			<p>Se hai bisogno di aiuto o hai domande, contatta il nostro team di supporto. Siamo qui per aiutarti!</p>
		</div>
	`;
}
