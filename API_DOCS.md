# Documentazione delle API

## Autenticazione

Attualmente, l'applicazione implementa l'autenticazione OAuth di Google

### [`GET /api/auth/google`](./src/routes/api/auth/google/+server.ts)

- **Descrizione**: Avvia il flusso di autenticazione OAuth 2.0 di Google.
- **Risposta**: Reindirizza alla pagina di autenticazione di Google.
- **Note**: Imposta i cookie per lo stato OAuth e il code verifier per il processo di verifica.

### [`GET /api/auth/google/callback`](./src/routes/api/auth/google/callback/+server.ts)

- **Descrizione**: Endpoint di callback per il processo OAuth 2.0 di Google.
- **Parametri Query**:
	- `code`: Codice di autorizzazione da Google
	- `state`: Parametro di stato per verificare la richiesta
- **Risposta**: 
	- Successo: Reindirizza alla homepage con il cookie di sessione impostato
	- Errore: Restituisce lo stato di errore appropriato (400, 500)

> Google richiede la registrazione di questo URL come URL di reindirizzamento autorizzato nella Google Cloud Console.
>
> Per farlo, vai su [Google Cloud Console](https://console.cloud.google.com/), seleziona il progetto, vai su "Api e servizi" -> "Credenziali" -> nella sezione "ID client OAuth 2.0" seleziona "Festa di Primavera".
>
> In "Origini JavaScript autorizzate" e "URI di reindirizzamento autorizzati" aggiungi o modifica i domini e gli URL autorizzati.

## Endpoint legati ai form delle pagine (Autenticazione)

### [`/?/logout`](./src/routes/+page.server.ts)
- **Descrizione**: Disconnette l'utente invalidando la sessione corrente.
- **Metodo**: POST
- **Richiede autenticazione**: Sì
- **Parametri**: Nessuno
- **Risposta**: 
  - Successo: Reindirizza a `/login`
  - Errore: Restituisce 401 se l'utente non è autenticato

### [`/login/?/signup`](./src/routes/login/+page.server.ts)
- **Descrizione**: Registra un nuovo utente con email e password.
- **Metodo**: POST
- **Parametri Form**:
  - `username`: Nome utente desiderato
  - `password`: Password scelta (min 8 caratteri, include maiuscole, numeri, caratteri speciali)
  - `password_repeat`: Conferma della password
  - `email`: Indirizzo email
- **Risposta**:
  - Successo: Reindirizza alla homepage con sessione autenticata
  - Errore: Restituisce un messaggio d'errore appropriato (password invalida, email già in uso, ecc.)
- **Note**: Invia automaticamente un'email di verifica dopo la registrazione.

### [`/login/?/signin`](./src/routes/login/+page.server.ts)
- **Descrizione**: Effettua il login con email/username e password.
- **Metodo**: POST
- **Parametri Form**:
  - `email`: Email o username dell'utente
  - `password`: Password dell'utente
- **Risposta**:
  - Successo: Reindirizza alla homepage con sessione autenticata se l'email è verificata
  - Successo: Reindirizza a `/login/verify-email` se l'email non è verificata
  - Errore: Restituisce un messaggio d'errore appropriato (credenziali errate, ecc.)

### [`/login/?/delete`](./src/routes/login/+page.server.ts)
- **Descrizione**: Elimina l'account utente corrente.
- **Metodo**: POST
- **Richiede autenticazione**: Sì
- **Parametri**: Nessuno
- **Risposta**:
  - Successo: Reindirizza a `/login` dopo aver eliminato l'account
  - Errore: Restituisce 400 con messaggio "Utente non autenticato"
- **Note**: Elimina tutti i dati associati all'utente (account, codici di verifica, token di reset password, sessioni).

### [`/login/password-reset/?/passwordResetRequest`](./src/routes/login/password-reset/+page.server.ts)
- **Descrizione**: Invia un'email per il reset della password.
- **Metodo**: POST
- **Parametri Form**:
  - `email`: Email dell'account di cui resettare la password
- **Risposta**:
  - Successo: Reindirizza alla homepage
  - Errore: Restituisce messaggi d'errore appropriati (account non trovato, account non verificato, ecc.)
- **Note**: Funziona solo per account con email verificata e che non utilizzano Google come provider di autenticazione.

### [`/login/password-reset/{token}/?/passwordReset`](./src/routes/login/password-reset/[token]/+page.server.ts)
- **Descrizione**: Permette di impostare una nuova password dopo aver ricevuto il token di reset.
- **Metodo**: POST
- **Parametri URL**:
  - `token`: Token per il reset della password
- **Parametri Form**:
  - `password`: Nuova password
  - `password_repeat`: Conferma della nuova password
  - `token`: Token di reset (stesso del parametro URL)
- **Risposta**:
  - Successo: Reindirizza a `/login`
  - Errore: Restituisce messaggi d'errore appropriati (token invalido, password non corrispondenti, ecc.)
- **Note**: Invalida automaticamente tutte le sessioni esistenti dell'utente per motivi di sicurezza.

### [`/login/verify-email/?/resendEmail`](./src/routes/login/verify-email/+page.server.ts)
- **Descrizione**: Invia nuovamente il codice di verifica email.
- **Metodo**: POST
- **Richiede autenticazione**: Sì
- **Parametri**: Nessuno
- **Risposta**: Nessuna risposta specifica, reinvia semplicemente l'email di verifica
- **Note**: Disponibile solo per utenti autenticati la cui email non è ancora verificata.

### [`/login/verify-email/?/verifyCode`](./src/routes/login/verify-email/+page.server.ts)
- **Descrizione**: Verifica il codice inviato all'email dell'utente.
- **Metodo**: POST
- **Richiede autenticazione**: Sì
- **Parametri Form**:
  - `code`: Codice di verifica a 6 cifre
- **Risposta**:
  - Successo: Reindirizza alla homepage
  - Errore: Restituisce un messaggio d'errore se il codice non è valido
- **Note**: Disponibile solo per utenti autenticati la cui email non è ancora verificata.
