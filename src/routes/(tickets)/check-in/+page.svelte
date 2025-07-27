<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import {
        AlertCircle,
        Check,
        CheckCircle2,
        X,
        XCircle
    } from "lucide-svelte";
    import { onMount } from "svelte";

    import InfoCard from "$components/InfoCard.svelte";
    import QrReader from "$components/QrReader.svelte";
    import type { User } from "$lib/auth/user";
    import type { Ticket } from "$models/ticket";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let ticketCode: string = $state("");
    let ticketCodeInput: string = $state("");

    let ticket: Ticket | undefined = $state();
    let errorsModalOpen: boolean = $state(false);

    let ticketStatus: "notFound" | "alreadyChecked" | "notSold" | null =
        $state(null);

    let color: "text-green-500" | "text-red-500" | "text-yellow-500" = $state("text-green-500");
    let feedbackMessage: string = $state("");

    let ticketInfos: Element | null = null;

    function scrollToDiv() {
        ticketInfos?.scrollIntoView({
            behavior: "smooth",
        });
    }

    async function checkTicket(code: string) {
        scrollToDiv();
        const response = await fetch(
            `/api/tickets/${encodeURIComponent(code.toUpperCase())}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const body = await response.json();
        let message = body.message;

        if (response.status == 404) {
            ticket = {
                ticketId: code,
                name: "",
                surname: "",
                seller: "",
                soldAt: null,
                checkIn: null,
            };

            triggerPopup(message, "text-red-500", "notFound");
            ticketCodeInput = "";
            return;
        }

        let tick = body.ticket;

        if (response.status == 402) {
            ticket = {
                ticketId: code,
                name: tick.name,
                surname: tick.surname,
                seller: tick.seller,
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
            };

            triggerPopup(message, "text-red-500", "notSold");
            ticketCodeInput = "";
            return;
        }

        if (response.status === 409) {
            ticket = {
                ticketId: code,
                name: tick.name,
                surname: tick.surname,
                seller: tick.seller,
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
            };

            triggerPopup(message, "text-yellow-500", "alreadyChecked");
            ticketCodeInput = "";
            return;
        }

        try {
            ticket = {
                ticketId: code,
                name: tick.name,
                surname: tick.surname,
                seller: response.status !== 206 ? tick.seller : "Non Trovato",
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
            };

            triggerPopup(message, "text-green-500", null);
            ticketCodeInput = "";
        } catch (e) {
            triggerPopup("Errore inaspettato", "text-red-500", "notFound");
            ticketCodeInput = "";
        }

        return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && ticketCodeInput !== "") {
            checkTicket(ticketCodeInput);
        }
    };

    function triggerPopup(
        message: string,
        col: "text-green-500" | "text-red-500" | "text-yellow-500",
        status: "notFound" | "alreadyChecked" | "notSold" | null
    ) {
        feedbackMessage = message;
        color = col;
        if (status != null) {
            errorsModalOpen = true;
        } else {
            if (col === "text-red-500") {
                toast.error(message);
            } else if (col === "text-yellow-500") {
                toast.warning(message);
            } else {
                toast.success(message);
            }
        }
        ticketStatus = status;
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
        ticketStatus = null;
        color = "text-green-500";
    };

    onMount(async () => {
        ticketInfos = document.querySelector("#ticketInfos");
    });

    $effect(() => {
        if (ticketCode !== "") {
            scrollToDiv();
            checkTicket(ticketCode);
        } else {
            reset();
        }
    });
</script>

<svelte:head>
    <title>Check-in</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        <h1 class="text-4xl font-bold text-primary-600">Check-in</h1>
        <p class="text-justify dark:text-white">
            Scansionare il QR e verificare la validità del biglietto
        </p>
        <div class="w-full">
            <Label
                for="ticketCodeInput"
                class="text-md font-medium text-black dark:text-white w-full"
            >
                Codice Biglietto <span class="text-chart-2">*</span>
            </Label>
            <div class="flex gap-3 items-center">
                <Input
                    required
                    class="mt-1 dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
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
                        <button onclick={() => checkTicket(ticketCodeInput)}>
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

            <InfoCard {ticketCode} {ticket} {color} />

            <Dialog.Root bind:open={errorsModalOpen}>
                {@const Icon =
                    ticketStatus === "notFound" || ticketStatus === "notSold"
                        ? XCircle
                        : ticketStatus === "alreadyChecked"
                          ? AlertCircle
                          : CheckCircle2}
                <Dialog.Content>
                    <Dialog.Title class="{color} text-2xl text-center">
                        <div class="flex items-center justify-center gap-2">
                            <Icon />
                            Attenzione
                        </div>
                    </Dialog.Title>
                    <Dialog.Description class="text-3xl text-center">
                        {feedbackMessage}
                    </Dialog.Description>
                </Dialog.Content>
            </Dialog.Root>
        </div>
    </div>
</section>
