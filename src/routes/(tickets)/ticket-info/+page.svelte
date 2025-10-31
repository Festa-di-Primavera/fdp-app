<script lang="ts">
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { Check, X } from "@lucide/svelte";
    import { onMount } from "svelte";

    import InfoCard from "$components/InfoCard.svelte";
    import QrReader from "$components/QrReader.svelte";
    import type { User } from "$lib/auth/user";
    import type { Ticket } from "$models/ticket";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

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

    async function getTicket(code: string) {
        const res = await fetch(`/api/tickets/${encodeURIComponent(code)}`);
        scrollToDiv();
        ticketCodeInput = "";

        if (res.status == 404) {
            toast.error("Codice biglietto errato");

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

<section class="flex h-full w-full grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        <h1 class="text-4xl font-bold text-app-accent">Info biglietto</h1>
        <p class="text-justify">
            Scansionare il QR per ottenere informazioni sul biglietto senza
            influenzare i check-in e le vendite
        </p>
        <div class="w-full">
            <Label for="ticketCodeInput" class="text-md font-medium w-full">
                Codice Biglietto <span class="text-app-accent">*</span>
            </Label>
            <div class="flex gap-3 items-center">
                <Input
                    required
                    class="mt-1"
                    bind:value={ticketCodeInput}
                    name="code"
                    id="ticketCodeInput"
                    autocomplete="off"
                    onkeypress={onKeyDown}
                    placeholder={"FDP" +
                        new Date().getFullYear().toString().slice(-2) +
                        "-XXXX"}
                />
                {#if ticketCodeInput !== ""}
                    <div class="flex h-full items-center gap-2">
                        <button onclick={() => getTicket(ticketCodeInput)}>
                            <Check color="green" />
                        </button>
                        <button onclick={reset}>
                            <X color="indianred" />
                        </button>
                    </div>
                {/if}
            </div>
            <div class="my-6 flex w-full items-center justify-center">
                <QrReader bind:codeResult={ticketCode} />
            </div>

            <InfoCard {ticketCode} {ticket} />
        </div>
    </div>
</section>
