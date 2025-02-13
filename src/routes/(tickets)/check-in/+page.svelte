<script lang="ts">
    import { Button, Input, Label, Modal, Spinner } from "flowbite-svelte";
    import {
        AlertCircle,
        Check,
        CheckCircle2,
        Ticket as TicketIcon,
        X,
        XCircle,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    import InfoCard from "$components/InfoCard.svelte";
    import QrReader from "$components/QrReader.svelte";
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import type { Ticket } from "$models/ticket";
    import { user } from "$store/store";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let ticketCode: string = $state("");
    let ticketCodeInput: string = $state("");

    let ticket: Ticket | undefined = $state();
    let feedbackToastOpen: boolean = $state(false);
    let errorsModalOpen: boolean = $state(false);
    let feedbackMessage: string = $state("");
    let timeOut: NodeJS.Timeout;

    const closeErrorsModal = () => {
        errorsModalOpen = false;
    };

    let ticketStatus: "notFound" | "alreadyChecked" | "notSold" | null =
        $state(null);

    let color: "green" | "red" | "yellow" = $state("green");

    let ticketInfos: Element | null = null;

    function scrollToDiv() {
        ticketInfos?.scrollIntoView({
            behavior: "smooth",
        });
    }

    async function checkTicket(code: string) {
        scrollToDiv();
        const response = await fetch(
            `/api/tickets/${encodeURIComponent(code)}`,
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
                ticketID: code,
                name: "",
                surname: "",
                seller: "",
                soldAt: null,
                checkIn: null,
            };

            triggerPopup(message, "red", "notFound");
            ticketCodeInput = "";
            return;
        }

        let tick = body.ticket;

        if (response.status == 402) {
            ticket = {
                ticketID: code,
                name: tick.name,
                surname: tick.surname,
                seller: tick.seller,
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
            };

            triggerPopup(message, "red", "notSold");
            ticketCodeInput = "";
            return;
        }

        if (response.status === 409) {
            ticket = {
                ticketID: code,
                name: tick.name,
                surname: tick.surname,
                seller: tick.seller,
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
            };

            triggerPopup(message, "yellow", "alreadyChecked");
            ticketCodeInput = "";
            return;
        }

        try {
            ticket = {
                ticketID: code,
                name: tick.name,
                surname: tick.surname,
                seller: response.status !== 206 ? tick.seller : "Non Trovato",
                soldAt: tick.soldAt,
                checkIn: tick.checkIn,
            };

            triggerPopup(message, "green", null);
            ticketCodeInput = "";
        } catch (e) {
            triggerPopup("Errore inaspettato", "red", "notFound");
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
        col: "red" | "green" | "yellow",
        status: "notFound" | "alreadyChecked" | "notSold" | null
    ) {
        feedbackMessage = message;
        if (status != null) errorsModalOpen = true;
        else feedbackToastOpen = true;
        color = col;
        ticketStatus = status;

        clearTimeout(timeOut);
        if (ticketStatus === null) {
            timeOut = setTimeout(() => {
                ticketStatus = null;
                feedbackToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);
        }
    }

    const reset = () => {
        ticket = {
            ticketID: "",
            name: "",
            surname: "",
            seller: "",
            soldAt: null,
            checkIn: null,
        };

        ticketCodeInput = "";
        ticketCode = "";
        feedbackToastOpen = false;
        ticketStatus = null;
        color = "green";
    };

    const getRemainingTime = () => {
        let now = new Date();
        let checkInTime = new Date("2024-04-18T00:30:00");

        return checkInTime.getTime() - now.getTime();
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
    let ToastIcon = $derived(
        ticketStatus === "notFound" || ticketStatus === "notSold"
            ? XCircle
            : ticketStatus === "alreadyChecked"
              ? AlertCircle
              : CheckCircle2
    );
</script>

<svelte:head>
    <title>Check-in</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        {#if $user}
            <h1 class="text-4xl font-bold text-primary-600">Check-in</h1>
            <p class="text-justify dark:text-white">
                Scansionare il QR e verificare la validità del biglietto
            </p>
            <div class="w-full">
                <Label class="text-md font-medium text-black dark:text-white">
                    Codice Biglietto <span class="text-primary-700">*</span>
                    <Input
                        required
                        class="mt-1"
                        bind:value={ticketCodeInput}
                        name="code"
                        autocomplete="off"
                        on:keypress={onKeyDown}
                    >
                        <TicketIcon
                            slot="left"
                            class="h-6 w-6 text-primary-600 dark:text-white"
                        />

                        <div
                            slot="right"
                            class="flex h-full items-center gap-2"
                        >
                            {#if ticketCodeInput !== ""}
                                <button
                                    onclick={() => checkTicket(ticketCodeInput)}
                                >
                                    <Check color="green" />
                                </button>
                                <button onclick={reset}>
                                    <X color="indianred" />
                                </button>
                            {/if}
                        </div>
                    </Input>
                </Label>
                <div class="my-6 flex w-full items-center justify-center">
                    <QrReader bind:codeResult={ticketCode} />
                </div>

                <InfoCard bind:ticketCode bind:ticket bind:color />

                <FeedbackToast
                    bind:open={feedbackToastOpen}
                    bind:color
                    bind:message={feedbackMessage}
                    {ToastIcon}
                />
                <Modal
                    bind:open={errorsModalOpen}
                    on:close={closeErrorsModal}
                    size="xs"
                    dismissable={false}
                >
                    {@const SvelteComponent =
                        ticketStatus === "notFound" ||
                        ticketStatus === "notSold"
                            ? XCircle
                            : ticketStatus === "alreadyChecked"
                              ? AlertCircle
                              : CheckCircle2}
                    <span
                        class="my-5 justify-center text-3xl font-semibold text-{color}-500 flex items-center gap-2"
                    >
                        <SvelteComponent class="h-6 w-6  text-{color}-400" />
                        {feedbackMessage}
                    </span>

                    <Button
                        slot="footer"
                        class="w-full"
                        on:click={closeErrorsModal}>Chiudi</Button
                    >
                </Modal>
            </div>
        {:else}
            <div
                class="mt-10 flex w-full flex-grow flex-col items-center justify-center gap-5"
            >
                <Spinner size="sm" class="max-w-12 self-center" />
                <span class="text-2xl font-semibold text-primary-600"
                    >Attendere...</span
                >
            </div>
        {/if}
    </div>
</section>
