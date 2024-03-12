<script lang="ts">
	import { onMount, onDestroy } from "svelte";
    import { Toast, Card, Spinner, Label, Input } from "flowbite-svelte";
    import { CheckCircle2, XCircle, AlertCircle, Ticket as TicketIcon, Check, X } from 'lucide-svelte';
	import { getAuth, signInWithCustomToken } from "firebase/auth";
    
	import { getClientApp, handleSignOut } from "$lib/firebase/client";
    
    import { user } from "../../store/store";
	import type { Ticket } from "../../models/ticket";
	import QrReader from "../../components/QrReader.svelte";
	import InfoCard from "../../components/InfoCard.svelte";
	import { goto } from "$app/navigation";

	export let data: {logout?: boolean, token?: string };

	let ticketCode: string = '';
	let ticketCodeInput: string = '';

    let ticket: Ticket;
    let open: boolean = false;
    let feedbackToastMessage: string = '';
    let timeOut: NodeJS.Timeout;
    let redirectTimeOut: NodeJS.Timeout;

    let ticketStatus: 'alert' | 'error' | 'success' | null = null;

    let color: 'green' | 'red' | 'yellow' = 'green';
    
	let toastOpen: boolean = false;
	let toastMessage: string = '';
    
    let ticketInfos: Element | null = null;

    function scrollToDiv() {
        ticketInfos?.scrollIntoView({
            behavior: 'smooth',
        });
    }

    async function checkOutTicket(code: string){        
        const response = await fetch(`/api/tickets/checkout/${code}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        scrollToDiv();

        const body = (await response.json());
        let message = body.message
        
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

            triggerToast(message, 'red', 'error');
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
                newCheckIn: tick.newCheckIn
            };

            triggerToast(message, 'red', 'error');
            ticketCodeInput = '';
            return
        }

        if(response.status === 409 || response.status === 406){
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

            triggerToast(message, 'yellow', 'alert');
            ticketCodeInput = '';
            return
        }

        ticket = {
            ticketID: code,
            name: tick.name,
            surname: tick.surname,
            seller: response.status !== 206 ? tick.seller : 'Non Trovato',
            soldAt: tick.soldAt,
            checkIn: tick.checkIn,
            checkOut: tick.checkOut,
            newCheckIn: tick.newCheckIn,
        };

        triggerToast(message, 'green', null);
        ticketCodeInput = '';
        return;
    }

    function triggerToast(message: string, col: 'red' | 'green' | 'yellow', status: 'error' | 'alert' | 'success' | null){
        feedbackToastMessage = message;
        open = true;
        color = col;
        ticketStatus = status;

        clearTimeout(timeOut);
        timeOut = setTimeout(() => {
            open = false;
            ticketStatus = null;
            clearTimeout(timeOut);
        }, 3500);
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
        ticketStatus = null;
        color = 'green';
    }

    const getRemainingTime = () => {
        let now = new Date();
        let checkOutTime = new Date();
        checkOutTime.setHours(16,52,0, 0);
        
        return checkOutTime.getTime() - now.getTime();
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if(e.key === 'Enter' && ticketCodeInput !== ''){
            checkOutTicket(ticketCodeInput);
        }
    }

    onMount(async() => {
		if(data.logout){
			handleSignOut(true);
			return;
		}
        
        ticketInfos = document.querySelector('#ticketInfos')

        /* redirectTimeOut = setTimeout(() => {
            clearTimeout(redirectTimeOut);
            goto('/?checkOutExpired')
        }, getRemainingTime()); */

		if(getAuth(getClientApp()).currentUser === null && data.token){
			signInWithCustomToken(getAuth(), data.token).then((userCredential) => {
				$user = userCredential.user;
			}).catch((error) => {
				if(error.code === 'auth/invalid-custom-token'){
					toastMessage = 'Token non valido';
				}
				else if(error.code === 'auth/network-request-failed'){
					toastMessage = 'Errore di rete';
				}
				else{
					toastMessage = 'Errore sconosciuto';
				}
				toastOpen = true;
                clearTimeout(timeOut);
                timeOut = setTimeout(() => {
                    toastOpen = false;
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
            checkOutTicket(ticketCode)
        }
        else{
            reset();
        }
    }
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
        {#if $user}
            <h1 class="text-primary-600 font-bold text-4xl">Check-out</h1>
            <p class="dark:text-white text-justify">Scansionare il QR per effettuare il check-out entro le 20:00</p>
            <div>
                <Label class="text-black dark:text-white font-medium text-md">
					Codice Biglietto <span class="text-primary-700">*</span>
					<Input required class="mt-1" bind:value={ticketCodeInput} name="code" autocomplete="off" on:keypress={onKeyDown}>
						<TicketIcon slot="left" class="w-6 h-6 text-primary-600 dark:text-white"/>

                        <div slot="right" class="h-full flex items-center gap-2">
                            {#if ticketCodeInput !== ''}
                                <button on:click={() => checkOutTicket(ticketCodeInput)}>
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
                    bind:ticketCodeInput
                    bind:ticket
                    bind:color
                    focus="checkOut"
                />

                <Toast on:close={() => open = false} bind:open color={color} class="w-max mt-5 mx-auto right-0 left-0 fixed top-20" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
                    <svelte:component this={ticketStatus === 'error' ? XCircle : (ticketStatus === 'alert' ? AlertCircle : CheckCircle2)} class="w-6 h-6  text-{color}-400" slot="icon"/>
                    <span class={`text-${color}-400 font-semibold`}>{feedbackToastMessage}</span>
                </Toast>
            </div>
        {:else}
            <div class="w-full flex flex-col flex-grow gap-5 items-center justify-center mt-10">
                <Spinner size="sm" class="max-w-12 self-center"/>
                <span class="text-primary-600 font-semibold text-2xl">Attendere...</span>
            </div>
        {/if}
    </div>
</section>

<Toast on:close={() => toastOpen = false} bind:open={toastOpen} color="red" class="w-max mt-10 mb-5 mx-auto right-0 left-0 fixed top-20" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
	<XCircle class="w-6 h-6  text-red-400" slot="icon"/>
	<span class='text-red-400 font-semibold'>{toastMessage}</span>
</Toast>