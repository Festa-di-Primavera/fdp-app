<script lang="ts">
    import { Input, Label, Spinner } from "flowbite-svelte";
    import { Check, Ticket as TicketIcon, X, XCircle } from "lucide-svelte";
    import { onMount } from "svelte";

    import InfoCard from "$components/InfoCard.svelte";
    import QrReader from "$components/QrReader.svelte";
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import type { Ticket } from "$models/ticket";
    import { user } from "$store/store";

    let ticketInfos: Element | null = null;

    function scrollToDiv() {
        ticketInfos?.scrollIntoView({
            behavior: "smooth",
        });
    }

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let ticketCode: string = $state("");
    let ticketCodeInput: string = $state("");

    let ticket: Ticket | undefined = $state();
    let open: boolean = $state(false);

    let timeOut: NodeJS.Timeout;

    async function getTicket(code: string) {
        const res = await fetch(`/api/tickets/${encodeURIComponent(code)}`);
        scrollToDiv();
        ticketCodeInput = "";

        if (res.status == 404) {
            open = true;

            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                open = false;
                clearTimeout(timeOut);
            }, 3500);

            ticket = {
                ticketId: code,
                name: "",
                surname: "",
                seller: "",
                soldAt: null,
                checkIn: null,
            };
            return;
        }

        let tick = (await res.json()).ticket;

        ticket = {
            ticketId: code,
            name: tick.name,
            surname: tick.surname,
            seller: res.status !== 206 ? tick.seller : "Non Trovato",
            soldAt: tick.soldAt,
            checkIn: tick.checkIn,
        };
    }

    const reset = () => {
        ticket = {
            ticketId: "",
            name: "",
            surname: "",
            seller: "",
            soldAt: null,
            checkIn: null,
        };

        ticketCodeInput = "";
        ticketCode = "";
        open = false;
    };

    onMount(async () => {
        ticketInfos = document.querySelector("#ticketInfos");
    });

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && ticketCodeInput !== "") {
            getTicket(ticketCodeInput);
        }
    };

    $effect(() => {
        if (ticketCode !== "") {
            getTicket(ticketCode);
        } else {
            reset();
        }
    });
</script>

<svelte:head>
    <title>Info Biglietti</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        <h1 class="text-4xl font-bold text-primary-600">Info biglietto</h1>
        <p class="text-justify dark:text-white">
            Scansionare il QR per ottenere informazioni sul biglietto senza
            influenzare i check-in e le vendite
        </p>
        <div class="w-full">
            <Label class="text-md font-medium text-black dark:text-white">
                Codice Biglietto <span class="text-primary-700">*</span>
                <Input
                    required
                    class="mt-1 dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                    bind:value={ticketCodeInput}
                    name="code"
                    autocomplete="off"
                    onkeypress={onKeyDown}
                >
                    {#snippet left()}
                        <TicketIcon
                            class="h-6 w-6 text-primary-600 dark:text-white"
                        />
                    {/snippet}

                    {#snippet right()}
                        <div class="flex h-full items-center gap-2">
                            {#if ticketCodeInput !== ""}
                                <button
                                    onclick={() => getTicket(ticketCodeInput)}
                                >
                                    <Check color="green" />
                                </button>
                                <button onclick={reset}>
                                    <X color="indianred" />
                                </button>
                            {/if}
                        </div>
                    {/snippet}
                </Input>
            </Label>
            <div class="my-6 flex w-full items-center justify-center">
                <QrReader bind:codeResult={ticketCode} />
            </div>

            <InfoCard {ticketCode} {ticket} />

            <FeedbackToast
                bind:open
                color="red"
                ToastIcon={XCircle}
                message="Codice biglietto errato"
            />
        </div>
    </div>
</section>
