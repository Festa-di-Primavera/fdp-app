<script lang="ts">
	import { onMount } from "svelte";
    import { Label, Input, Modal, Button } from "flowbite-svelte";
    import { CheckCircle2, XCircle, AlertCircle, Ticket as TicketIcon, Check, X } from 'lucide-svelte';
	import type { Ticket } from "../../models/ticket";
	import QrReader from "../../components/QrReader.svelte";
	import InfoCard from "../../components/InfoCard.svelte";
	import FeedbackToast from "../../components/feedbacks/FeedbackToast.svelte";
	import SignInToast from "../../components/feedbacks/SignInToast.svelte";
    import { convertCode } from "$lib/codeConverter";

	let ticketCode: string = '';
	let ticketCodeInput: string = '';

    let ticket: Ticket;
    let feedbackToastOpen: boolean = false;
    let errorsModalOpen: boolean = false;
    let feedbackMessage: string = '';
    let timeOut: NodeJS.Timeout;

    const closeErrorsModal = () => {
		errorsModalOpen = false;
	}

    let ticketStatus: 'notFound' | 'alreadyChecked' | 'notSold' | null = null;

    let color: 'green' | 'red' | 'yellow' = 'green';
    let focus: 'checkIn' | 'newCheckIn' | null = null;
    
	let signInToastOpen: boolean = false;
	let signInToastMessage: string = '';
    
    let ticketInfos: Element | null = null;

    let fileContent: Map<string, {name: string, surname: string, seller: string, soldAt: string, checkIn: string}> = new Map();

    function scrollToDiv() {
        ticketInfos?.scrollIntoView({
            behavior: 'smooth',
        });
    }

    async function checkTicket(code: string) {
        scrollToDiv();

        let generalCode = convertCode(code);

        if(generalCode === null || !fileContent.has(generalCode)){
            triggerPopup('Biglietto non trovato', 'red', 'notFound');
            return;
        }

        let ticketData = fileContent.get(generalCode)!;
        if(ticketData.soldAt === ''){
            triggerPopup('Biglietto non venduto', 'red', 'notSold');
            return;
        }

        if(ticketData.checkIn !== ''){
            triggerPopup('Biglietto già validato', 'yellow', 'alreadyChecked');
            return;
        }

        ticket = {
            ticketID: generalCode,
            name: ticketData.name,
            surname: ticketData.surname,
            seller: ticketData.seller,
            soldAt: new Date(ticketData.soldAt),
            checkIn: new Date(),
            checkOut: null,
            newCheckIn: null
        };
        ticketData.checkIn = ticket.checkIn!.toISOString();
        fileContent.set(generalCode, ticketData);
        focus = 'checkIn'

        const resp = await fetch('/api/recovery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticket)
        });

        triggerPopup('Biglietto validato', 'green', null);

        console.log(fileContent)

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

    onMount(async() => {
        ticketInfos = document.querySelector('#ticketInfos');

        const response = await fetch(`/codes.csv`);
        const data = await response.text();

        let rows = data.split('\r\n').slice(1);
        // if there is no \r
        if(rows.length === 1){
            rows = data.split('\n').slice(1);
        }
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].split(',');
            
            fileContent.set(row[0], {
                name: row[1],
                surname: row[2],
                seller: row[5],
                soldAt: row[4],
                checkIn: row[3]
            });
        }
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
    <title>Recovery</title>
</svelte:head>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow">
        <h1 class="text-primary-600 font-bold text-4xl">Recovery</h1>
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
            <!-- resolve ReferenceError: document is not defined -->
            <div class="w-full my-6 flex items-center justify-center">
                {#if typeof document !== 'undefined'}
                    <QrReader bind:codeResult={ticketCode}/>
                {/if}
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
    </div>
</section>

<SignInToast bind:open={signInToastOpen} bind:message={signInToastMessage} />