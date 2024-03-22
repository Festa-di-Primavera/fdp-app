<script lang="ts">
	import { onMount } from "svelte";
    import { Toast, Card, Spinner, Label, Input } from "flowbite-svelte";
    import { XCircle, Ticket as TicketIcon, Check, X } from 'lucide-svelte';
	import { getAuth, signInWithCustomToken } from "firebase/auth";
    
	import { getClientApp, handleSignOut } from "$lib/firebase/client";
    
    import { user } from "../../store/store";
	import type { Ticket } from "../../models/ticket";
	import QrReader from "../../components/QrReader.svelte";
	import InfoCard from "../../components/InfoCard.svelte";
	import SignInToast from "../../components/feedbacks/SignInToast.svelte";
	import FeedbackToast from "../../components/feedbacks/FeedbackToast.svelte";

    let ticketInfos: Element | null = null;

    function scrollToDiv() {
        ticketInfos?.scrollIntoView({
            behavior: 'smooth',
        });
    }

	export let data: {logout?: boolean, token?: string };

	let ticketCode: string = '';
	let ticketCodeInput: string = '';

    let ticket: Ticket;
    let open: boolean = false;
    
	let signInToastOpen: boolean = false;
	let signInToastMessage: string = '';
    let timeOut: NodeJS.Timeout;

    async function getTicket(code: string){
        const res = await fetch(`/api/tickets/${code}`);
        scrollToDiv();
        ticketCodeInput = '';
        
        if(res.status == 404){
            open = true;

            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                open = false;
                clearTimeout(timeOut);
            }, 3500);

            ticket = {
                ticketID: code,
                name: '',
                surname: '',
                seller: '',
                soldAt: null,
                checkIn: null,
                checkOut: null,
                newCheckIn: null,
            };
            return
        }

        let tick = (await res.json()).ticket

        ticket = {
            ticketID: code,
            name: tick.name,
            surname: tick.surname,
            seller: res.status !== 206 ? tick.seller : 'Non Trovato',
            soldAt: tick.soldAt,
            checkIn: tick.checkIn,
            checkOut: tick.checkOut,
            newCheckIn: tick.newCheckIn,
        };
    }

    const reset = () => {
        ticket = {
            ticketID: '',
            name: '',
            surname: '',
            seller: '',
            soldAt: null,
            checkIn: null,
            checkOut: null,
            newCheckIn: null,
        };

        ticketCodeInput = '';
        ticketCode = '';
        open = false;
    }

    onMount(async() => {
		if(data.logout){
			handleSignOut(true);
			return;
		}
        ticketInfos = document.querySelector('#ticketInfos')
		if(getAuth(getClientApp()).currentUser === null && data.token){
			signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
				$user = userCredential.user;
			}).catch((error) => {
				if(error.code === 'auth/invalid-custom-token'){
					signInToastMessage = 'Token non valido';
				}
				else if(error.code === 'auth/network-request-failed'){
					signInToastMessage = 'Errore di rete';
				}
				else{
					signInToastMessage = 'Errore sconosciuto';
				}
				signInToastOpen = true;
                clearTimeout(timeOut);
                timeOut = setTimeout(() => {
                    signInToastOpen = false;
                    clearTimeout(timeOut);
                }, 3500);
			});
		}
	});

    const onKeyDown = (e: KeyboardEvent) => {
        if(e.key === 'Enter' && ticketCodeInput !== ''){
            getTicket(ticketCodeInput);
        }
    }

    $:{
        if(ticketCode !== ''){
            getTicket(ticketCode)
        }
        else{
            reset();
        }
    }
</script>

<svelte:head>
    <title>Info Biglietti</title>
</svelte:head>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
        {#if $user}
            <h1 class="text-primary-600 font-bold text-4xl">Info biglietto</h1>
            <p class="dark:text-white text-justify">Scansionare il QR per ottenere informazioni sul biglietto senza influenzare i check-in e le vendite</p>
            <div class="w-full">
                <Label class="text-black dark:text-white font-medium text-md">
					Codice Biglietto <span class="text-primary-700">*</span>
					<Input required class="mt-1" bind:value={ticketCodeInput} name="code" autocomplete="off" on:keypress={onKeyDown}>
						<TicketIcon slot="left" class="w-6 h-6 text-primary-600 dark:text-white"/>

                        <div slot="right" class="h-full flex items-center gap-2">
                            {#if ticketCodeInput !== ''}
                                <button on:click={() => getTicket(ticketCodeInput)}>
                                    <Check color="green"/>
                                </button>
                                <button on:click={reset}>
                                    <X color="indianred"/>
                                </button>
                            {/if}
                        </div>
					</Input>
				</Label>
                <div class="w-full my-6 flex items-center justify-center">
                    <QrReader bind:codeResult={ticketCode}/>
                </div>

                <InfoCard
                    bind:ticketCode
                    bind:ticket
                />
                
                <FeedbackToast bind:open color='red' icon={XCircle} message="Codice biglietto errato"/>
            </div>
        {:else}
            <div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
                <Spinner size="sm" class="max-w-12 self-center"/>
                <span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
            </div>
        {/if}
    </div>
</section>

<SignInToast bind:open={signInToastOpen} bind:message={signInToastMessage} />
