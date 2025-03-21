export function verificationCodeTemplate(code: string) {
    return `
		<!DOCTYPE html>
		<html lang="it" style="margin: 0; padding: 0;">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Codice di Verifica Email</title>
		</head>
		<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333;">
			<div style="background-color: #ffffff; margin: 50px auto; padding: 20px; max-width: 600px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
				<div style="text-align: center; background-color: #008b27; padding: 20px 0; border-radius: 10px 10px 0 0;">
					<img src="https://i.ibb.co/8D5qFGBw/logo.png" alt="email-logo" border="0" height="75rem">
				</div>
				<div style="padding: 30px; text-align: center;">
					<h2 style="font-size: 24px; color: #333; margin-bottom: 20px;">Benvenuto nell'app della Festa di Primavera!</h2>
					<p>Per completare la procedura, è necessario verificare il tuo indirizzo email.</p>
					<p>Il tuo codice di verifica è:</p>
					<div style="text-align: center; margin: 20px 0;">
						<div style="font-size: 28px; font-weight: bold; color: #008b27; background-color: #f9f9f9; padding: 15px; border: 2px dashed #008b27; letter-spacing: 5px; display: inline-block; margin-bottom: 10px;">${code}</div>
					</div>
					<p>Inserisci questo codice nella pagina di verifica per attivare il tuo account.</p>
					<p>Se non hai richiesto questo codice, ti preghiamo di ignorare questa email e/o di contattare i responsabili.</p>
				</div>
			</div>
		</body>
		</html>
	`;
}
