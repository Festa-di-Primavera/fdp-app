<script lang="ts">
	import { onMount } from "svelte";
    import { Toast, Card, Spinner } from "flowbite-svelte";
    import { CheckCircle2, XCircle, AlertCircle } from 'lucide-svelte';
	import { getAuth, signInWithCustomToken } from "firebase/auth";
    
	import { getClientApp } from "$lib/firebase/client";
    
    import { user } from "../../store/store";
	import type { Ticket } from "../../models/ticket";
	import QrReader from "../../components/QrReader.svelte";

    export let data: { token: string };

	let ticketCode: string;

    let ticket: Ticket;
    let open: boolean = false;

    let notFound: boolean = false;
    let alreadyChecked: boolean = false;
    let notSold: boolean = false;
    let color: 'green' | 'red' | 'yellow' = 'green';

    async function checkTicket(ticketCode: string){
        const res = await (await fetch(`/api/tickets/${ticketCode}`)).json()
        
        if(res.status == 404){
            notFound = true;
            color = 'red';
            open = true;
            return
        }
        
        let tick = res.body.ticket

        if(res.status == 402){
            notSold = true;
            color = 'red';
            open = true;

            ticket = {
                ticketID: ticketCode,
                name: tick.name,
                surname: tick.surname,
                checkIn: tick.checkIn,
                soldAt: tick.soldAt,
                seller: tick.seller
            } as Ticket;

            return
        }

        if(tick.checkIn !== null && tick.checkIn !== undefined && tick.checkIn !== ''){
            alreadyChecked = true;
            color = 'yellow';
            open = true;

            ticket = {
                ticketID: ticketCode,
                name: tick.name,
                surname: tick.surname,
                checkIn: tick.checkIn,
                soldAt: tick.soldAt,
                seller: res.status !== 206 ? tick.seller : 'Non Trovato'
            } as Ticket;
            return
        }

        const response = await fetch(`/api/tickets/${ticketCode}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        tick = (await response.json()).body.ticket

        ticket = {
            ticketID: ticketCode,
            name: tick.name,
            surname: tick.surname,
            checkIn: tick.checkIn,
            soldAt: tick.soldAt,
            seller: res.status !== 206 ? tick.seller : 'Non Trovato'
        } as Ticket;
        open = true;
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
				// TODO: ERROR HANDLING
			});
		}
	});

    $:{
        if(ticketCode !== '' && ticketCode !== undefined){
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
                <div class="w-full my-6 flex items-center justify-center">
                    <QrReader bind:codeResult={ticketCode}/>
                </div>

                <Card class="w-full flex flex-col text-lg p-3">
                    <span class="text-black dark:text-white w-full flex justify-between">
                        <span>N° biglietto:</span>
                        <span>{ticket.ticketID || ticketCode}</span>
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
                <Toast bind:open color={color} class="w-max mt-5 mx-auto right-0 left-0" divClass= 'w-full max-w-xs p-2 text-gray-500 bg-white shadow dark:text-gray-400 dark:bg-gray-700 gap-3'>
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