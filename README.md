# Software per la gestione dei biglietti della Festa di Primavera

## Descrizione
Software per la gestione dei biglietti della Festa di Primavera 2024 organizzata dallo Studentato Universitario Salesiano "Piergiorgio Frassati" di Trento

## Developers
- [Benevelli Riccardo](https://github.com/RickyBenevelli)
- [Tonini Isaia](https://github.com/Isax03)

## Tech Stack
#### Framework JS
<a href="https://kit.svelte.dev/"><img src="https://github.com/marwin1991/profile-technology-icons/assets/136815194/e56b5093-2f58-40cc-b194-5bdde41077b5" width="30"/></a>

#### UI
<a href="https://flowbite-svelte.com/"><img src="https://flowbite-svelte.com/images/flowbite-svelte-icon-logo.svg" width="30"/></a>
<a href="https://tailwindcss.com/"><img src="https://user-images.githubusercontent.com/25181517/202896760-337261ed-ee92-4979-84c4-d4b829c7355d.png" width="30"/></a>
<a href="https://lucide.dev/"><img src="https://lucide.dev/logo.light.svg" width="30"/></a>

#### Database and Auth
<a href="https://firebase.google.com/"><img src="https://user-images.githubusercontent.com/25181517/189716855-2c69ca7a-5149-4647-936d-780610911353.png" width="30"/></a>

#### Hosting
<a href="https://vercel.com/"><img src="https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png" width="30"/></a>

## Struttura e organizzazione del progetto 

### Hosting
Il progetto è hostato su [Vercel](https://vercel.com/) che è collegato direttamente al repository GitHub. Ogni push sul branch `main` attiva un deploy automatico.

Sul progetto Vercel è stato configurato un cron job per pulire il database da sessioni o token scaduti.

Su Vercel è stato impostato un dominio personalizzato `festa-cus.it` che è stato collegato al progetto.

### Invio email di verifica
Per l'invio delle email di verifica è stato utilizzato il servizio di [ReSend](https://resend.com/). Attualmente è stato configurato il dominio gratuito `festa-cus.it`.

### Database
Il database utilizzato è [Firebase](https://firebase.google.com/). Per l'autenticazione non è stata utilizzata la funzione di autenticazione di Firebase, ma è stata usata la libreria `lucia-auth` che si appoggia al database Firestore.

### Environment Variables
Le variabili d'ambiente richieste dal progetto sono:
 - Necessarie per `Firebase`
	```
	VITE_API_KEY
	VITE_AUTH_DOMAIN
	VITE_PROJECT_ID
	VITE_STORAGE_BUCKET
	VITE_MESSAGING_SENDER_ID
	VITE_APP_ID
	```
 - Necessarie per `Lucia Auth` (generabili dalla [_`Google Cloud Console`_](https://console.cloud.google.com/))
	```
 	GOOGLE_CLIENT_ID
	GOOGLE_CLIENT_SECRET
	GOOGLE_REDIRECT_URI
	```

 - Per resend è necessaria la API Key generata dal sito 
 	```
	RESEND_API_KEY
	```
 - Per il cron job di Vercel è possibile (ma non necessario) impostarer una variabile per verificare che il cron job sia stato chiamato dal servizio di Vercel, garantendo una sorta di autenticazione.
	```
	CRON_SECRET
	```
 	Il valore attualmente impostato su Vercel è un token generato casualmente da un servizio online non correlato al progetto.
