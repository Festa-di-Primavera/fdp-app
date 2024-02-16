<script lang="ts">
	import { onMount } from "svelte";
    import { Toast, Card, Spinner, Label, Input } from "flowbite-svelte";
    import { CheckCircle2, XCircle, AlertCircle, Ticket as TicketIcon, Check, X } from 'lucide-svelte';
	import { getAuth, signInWithCustomToken } from "firebase/auth";
    
	import { getClientApp } from "$lib/firebase/client";
    
    import { user } from "../../store/store";
	import type { Ticket } from "../../models/ticket";
	import QrReader from "../../components/QrReader.svelte";

    export let data: { token: string };

	let ticketCode: string = '';
	let ticketCodeInput: string = '';

    let ticket: Ticket;
    let open: boolean = false;

    let notFound: boolean = false;
    let alreadyChecked: boolean = false;
    let notSold: boolean = false;
    let color: 'green' | 'red' | 'yellow' = 'green';
    
	let toastOpen: boolean = false;
	let toastMessage: string = '';

    async function checkTicket(code: string){
        const res = await (await fetch(`/api/tickets/${code}`)).json()
        
        if(res.status == 404){
            notFound = true;
            color = 'red';
            open = true;

            const timeOut = setTimeout(() => {
                open = false;
                notFound = false;
                clearTimeout(timeOut);
            }, 3500);

            ticket = {
                ticketID: code,
                name: '',
                surname: '',
                checkIn: null,
                soldAt: null,
                seller: ''
            } as Ticket;

            ticketCodeInput = '';
            return
        }
        
        let tick = res.body.ticket

        if(res.status == 402){
            notSold = true;
            color = 'red';
            open = true;

            const timeOut = setTimeout(() => {
                open = false;
                notSold = false;
                clearTimeout(timeOut);
            }, 3500);

            ticket = {
                ticketID: code,
                name: tick.name,
                surname: tick.surname,
                checkIn: tick.checkIn,
                soldAt: tick.soldAt,
                seller: tick.seller
            } as Ticket;
            ticketCodeInput = '';
            return
        }

        if(tick.checkIn !== null && tick.checkIn !== undefined && tick.checkIn !== ''){
            alreadyChecked = true;
            color = 'yellow';
            open = true;
            toastMessage = 'Biglietto già validato';

            const timeOut = setTimeout(() => {
                open = false;
                alreadyChecked = false;
                clearTimeout(timeOut);
            }, 3500);

            ticket = {
                ticketID: code,
                name: tick.name,
                surname: tick.surname,
                checkIn: tick.checkIn,
                soldAt: tick.soldAt,
                seller: res.status !== 206 ? tick.seller : 'Non Trovato'
            } as Ticket;
            ticketCodeInput = '';
            return
        }

        const response = await fetch(`/api/tickets/${code}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        tick = (await response.json()).body.ticket

        ticket = {
            ticketID: code,
            name: tick.name,
            surname: tick.surname,
            checkIn: tick.checkIn,
            soldAt: tick.soldAt,
            seller: res.status !== 206 ? tick.seller : 'Non Trovato'
        } as Ticket;
        ticketCodeInput = '';
        open = true;

        const timeOut = setTimeout(() => {
            open = false;
            clearTimeout(timeOut);
        }, 3500);
    }

    const reset = () => {
        ticket = {
            ticketID: '',
            name: '',
            surname: '',
            checkIn: null,
            soldAt: null,
            seller: ''
        } as Ticket;

        ticketCodeInput = '';
        ticketCode = '';
        open = false;
        notFound = false;
        alreadyChecked = false;
        notSold = false;
        color = 'green';
    }

    onMount(async() => {
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
                const timeOut = setTimeout(() => {
                    toastOpen = false;
                    clearTimeout(timeOut);
                }, 3500);
			});
		}
	});

    $:{
        if(ticketCode !== ''){
            checkTicket(ticketCode)
        }
        else{
            reset();
        }
    }
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
        {#if $user}
            <h1 class="text-primary-600 font-bold text-4xl">Check-in</h1>
            <p class="dark:text-white text-justify">Scansionare il QR e verificare la validità del biglietto</p>
            <div>
                <Label class="text-black dark:text-white font-medium text-md">
					Codice Biglietto <span class="text-primary-700">*</span>
					<Input required class="mt-1" bind:value={ticketCodeInput} name="code" autocomplete="off">
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

                <Card class="w-full flex flex-col text-lg p-3">
                    <span class="text-black dark:text-white w-full flex justify-between">
                        <span>N° biglietto:</span>
                        <span>{ticket.ticketID || ticketCode || ticketCodeInput}</span>
                    </span>
                    <span class="text-black dark:text-white w-full flex justify-between">
                        <span>Nominativo:</span>
                        <span>{(ticket.name || '') + ' ' + (ticket.surname || '')}</span>
                    </span>
                    <span class="text-black dark:text-white w-full flex justify-between">
                        <span>Ingresso:</span>
                        <span class="text-{color}-400 font-bold">{ticket.checkIn ? (new Date(ticket.checkIn)).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : ''}</span>
                    </span>
                    <span class="text-black dark:text-white w-full flex justify-between">
                        <span>Venditore:</span>
                        <span>{ticket.seller || ''}</span>
                    </span>
                    <span class="text-black dark:text-white w-full flex justify-between">
                        <span>Venduto:</span>
                        <span>{ticket.soldAt ? (new Date(ticket.soldAt)).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }) : ''}</span>
                    </span>
                </Card>
                <Toast on:close={() => open = false} bind:open color={color} class="w-max mt-5 mx-auto right-0 left-0 fixed top-20" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
                    <svelte:component this={notFound ? XCircle : (alreadyChecked ? AlertCircle : CheckCircle2)} class="w-6 h-6  text-{color}-400" slot="icon"/>
                    {#if notFound}
                        <span class={`text-${color}-400 font-semibold`}>Codice biglietto errato</span>
                    {:else if notSold}
                        <span class={`text-${color}-400 font-semibold`}>Biglietto NON venduto!</span>
                    {:else if alreadyChecked}
                        <span class={`text-${color}-400 font-semibold`}>Biglietto già validato</span>
                    {:else}
                        <span class={`text-${color}-400 font-semibold`}>Biglietto validato</span>
                    {/if}
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