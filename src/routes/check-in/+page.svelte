<script lang="ts">
	import { onMount, onDestroy } from "svelte";
    import { Spinner, Label, Input, Modal, Button } from "flowbite-svelte";
    import { CheckCircle2, XCircle, AlertCircle, Ticket as TicketIcon, Check, X } from 'lucide-svelte';
	import { getAuth, signInWithCustomToken } from "firebase/auth";
    
	import { getClientApp, handleSignOut } from "$lib/firebase/client";
    
    import { user } from "../../store/store";
	import type { Ticket } from "../../models/ticket";
	import QrReader from "../../components/QrReader.svelte";
	import InfoCard from "../../components/InfoCard.svelte";
	import FeedbackToast from "../../components/feedbacks/FeedbackToast.svelte";
	import SignInToast from "../../components/feedbacks/SignInToast.svelte";
	import { goto } from "$app/navigation";

	export let data: {logout?: boolean, token?: string };

	let ticketCode: string = '';
	let ticketCodeInput: string = '';

    let ticket: Ticket;
    let feedbackToastOpen: boolean = false;
    let errorsModalOpen: boolean = false;
    let feedbackMessage: string = '';
    let timeOut: NodeJS.Timeout;
    let redirectTimeOut: NodeJS.Timeout;

    const closeErrorsModal = () => {
		errorsModalOpen = false;
	}

    let ticketStatus: 'notFound' | 'alreadyChecked' | 'notSold' | null = null;

    let color: 'green' | 'red' | 'yellow' = 'green';
    let focus: 'checkIn' | 'newCheckIn' | null = null;
    
	let signInToastOpen: boolean = false;
	let signInToastMessage: string = '';
    
    let ticketInfos: Element | null = null;

    function scrollToDiv() {
        ticketInfos?.scrollIntoView({
            behavior: 'smooth',
        });
    }

    async function checkTicket(code: string) {
        scrollToDiv();
        const response = await fetch(`/api/tickets/${encodeURIComponent(code)}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const body = (await response.json());
        let message = body.message;
        focus = (body.second) ? 'newCheckIn' : 'checkIn';
        
        if(response.status == 404){
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

            triggerPopup(message, 'red', 'notFound');
            ticketCodeInput = '';
            return
        }
        
        let tick = body.ticket

        if(response.status == 402){
            ticket = {
                ticketID: code,
                name: tick.name,
                surname: tick.surname,
                seller: tick.seller,
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
                checkOut: tick.checkOut,
                newCheckIn: tick.newCheckIn,
            };

            triggerPopup(message, 'red', 'notSold');
            ticketCodeInput = '';
            return
        }

        if(response.status === 409){
            ticket = {
                ticketID: code,
                name: tick.name,
                surname: tick.surname,
                seller: tick.seller,
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
                checkOut: tick.checkOut,
                newCheckIn: tick.newCheckIn,
            };

            triggerPopup(message, 'yellow', 'alreadyChecked');
            ticketCodeInput = '';
            return
        }

        try{
            ticket = {
                ticketID: code,
                name: tick.name,
                surname: tick.surname,
                seller: response.status !== 206 ? tick.seller : 'Non Trovato',
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
                checkOut: tick.checkOut,
                newCheckIn: tick.newCheckIn
            };

            triggerPopup(message, 'green', null);
            ticketCodeInput = '';
            
        }
        catch(e){
            triggerPopup('Errore inaspettato', 'red', 'notFound');
            ticketCodeInput = '';
        }

        return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if(e.key === 'Enter' && ticketCodeInput !== ''){
            checkTicket(ticketCodeInput);
        }
    }

    function triggerPopup(message: string, col: 'red' | 'green' | 'yellow', status: 'notFound' | 'alreadyChecked' | 'notSold' | null){
        feedbackMessage = message;
        if(status != null)
            errorsModalOpen = true;
        else
            feedbackToastOpen = true;
        color = col;
        ticketStatus = status;

        clearTimeout(timeOut);
        if(ticketStatus === null){
            timeOut = setTimeout(() => {
                ticketStatus = null;
                feedbackToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);
        }
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
            newCheckIn: null
        };

        ticketCodeInput = '';
        ticketCode = '';
        feedbackToastOpen = false;
        ticketStatus = null;
        color = 'green';
        focus = null;
    }

    const getRemainingTime = () => {
        let now = new Date();
        let checkInTime = new Date('2024-04-18T00:30:00');
        
        return checkInTime.getTime() - now.getTime();
    }

    onMount(async() => {
		if(data.logout){
			handleSignOut(true);
			return;
		}
        
        ticketInfos = document.querySelector('#ticketInfos')

        /* redirectTimeOut = setTimeout(() => {
            clearTimeout(redirectTimeOut);
            goto('/?checkInExpired')
        }, getRemainingTime()); */


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

    onDestroy(() => {
        clearTimeout(redirectTimeOut);
    });

    $:{
        if(ticketCode !== ''){
            scrollToDiv();
            checkTicket(ticketCode)
        }
        else{
            reset();
        }
    }
    $: toastIcon = ticketStatus === 'notFound' || ticketStatus === 'notSold' ? XCircle : (ticketStatus === 'alreadyChecked' ? AlertCircle : CheckCircle2)
</script>

<svelte:head>
    <title>Check-in</title>
</svelte:head>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
        {#if $user}
            <h1 class="text-primary-600 font-bold text-4xl">Check-in</h1>
            <p class="dark:text-white text-justify">Scansionare il QR e verificare la validità del biglietto</p>
            <div class="w-full">
                <Label class="text-black dark:text-white font-medium text-md">
					Codice Biglietto <span class="text-primary-700">*</span>
					<Input required class="mt-1" bind:value={ticketCodeInput} name="code" autocomplete="off" on:keypress={onKeyDown}>
						<TicketIcon slot="left" class="w-6 h-6 text-primary-600 dark:text-white"/>

                        <div slot="right" class="h-full flex items-center gap-2">
                            {#if ticketCodeInput !== ''}
                                <button on:click={() => checkTicket(ticketCodeInput)}>
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
                    bind:color
                    bind:focus
                />
                
                <FeedbackToast bind:open={feedbackToastOpen} bind:color bind:message={feedbackMessage} bind:icon={toastIcon}/>
                <Modal bind:open={errorsModalOpen} on:close={closeErrorsModal} size="xs" dismissable={false}>
                    <span class="text-3xl justify-center my-5 font-semibold text-{color}-500 flex items-center gap-2">
                        <svelte:component this={ticketStatus === 'notFound' || ticketStatus === 'notSold' ? XCircle : (ticketStatus === 'alreadyChecked' ? AlertCircle : CheckCircle2)} class="w-6 h-6  text-{color}-400"/>
                        {feedbackMessage}
                    </span>
                    <Button class="w-full" on:click={closeErrorsModal} slot="footer">Chiudi</Button>
                </Modal>
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