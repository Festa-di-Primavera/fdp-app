<script lang="ts">
    import { Button, Input, Label, Modal, Spinner } from "flowbite-svelte";
    import { CheckCircle2, Ticket, XCircle } from "lucide-svelte";

    import QrReader from "$components/QrReader.svelte";
    import type { User } from "$lib/auth/user";
    import { getFdPCode } from "$lib/utils/tickets";
    import { user } from "$store/store";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let ticketCode: string = $state("");

    let modalOpen: boolean = $state(false);
    let modalMessage: string = $state("");
    let color: "green" | "red" = $state("green");
    let error: boolean = $state(false);

    let name: string = $state("");
    let surname: string = $state("");

    let disableButton = $state(true);
    $effect(() => {
        disableButton = name === "" || surname === "" || ticketCode === "";
    });

    const onKeyDown = (e: KeyboardEvent) => {
        if (
            e.key === "Enter" &&
            name !== "" &&
            surname !== "" &&
            ticketCode !== ""
        ) {
            handleSell();
        }
    };

    async function handleSell() {
        disableButton = true;
        if (name !== "" && surname !== "" && ticketCode !== "") {
            name = name.trim().toUpperCase();
            surname = surname.trim().toUpperCase();
            ticketCode = getFdPCode(ticketCode?.trim()) ?? "";

            try {
                let response;
                if (ticketCode !== "") {
                    response = await fetch(`/api/tickets/${ticketCode}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            name,
                            surname,
                            seller: $user?.id,
                        }),
                    });
                }

                if (response?.ok) {
                    error = false;
                    color = "green";
                } else {
                    error = true;
                    color = "red";
                }

                modalMessage =
                    ticketCode !== ""
                        ? (await response!.json()).message
                        : "Biglietto non valido";
                modalOpen = true;
            } catch (e) {
                color = "red";
                modalMessage = "Errore di rete";
                error = true;
                modalOpen = true;
            }
        } else {
            modalMessage = "Compilare tutti i campi";
            color = "red";
            modalOpen = true;
        }
    }

    const closeModal = () => {
        if (!error) {
            name = "";
            surname = "";
        }
        ticketCode = "";
        modalOpen = false;
    };
</script>

<svelte:head>
    <title>Vendi</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        {#if $user}
            <h1 class="text-4xl font-bold text-primary-600">Vendi</h1>
            <p class="text-justify dark:text-white">
                Inserire nome, cognome e, scansionando il QR, il codice del
                biglietto.
            </p>

            <Label
                class="text-md w-full font-medium text-black dark:text-white"
            >
                Nome Ospite <span class="text-primary-700">*</span>
                <Input
                    class="mt-1"
                    bind:value={name}
                    autocomplete="off"
                    on:keypress={onKeyDown}
                />
            </Label>
            <Label
                class="text-md w-full font-medium text-black dark:text-white"
            >
                Cognome Ospite <span class="text-primary-700">*</span>
                <Input
                    class="mt-1"
                    bind:value={surname}
                    autocomplete="off"
                    on:keypress={onKeyDown}
                />
            </Label>
            <Label
                class="text-md w-full font-medium text-black dark:text-white"
            >
                Codice Biglietto <span class="text-primary-700">*</span>
                <Input
                    class="mt-1"
                    bind:value={ticketCode}
                    autocomplete="off"
                    on:keypress={onKeyDown}
                >
                    <Ticket
                        slot="left"
                        class="h-6 w-6 text-primary-600 dark:text-white"
                    />
                </Input>
            </Label>

            <div class="mt-6 flex w-full items-center justify-center">
                <QrReader bind:codeResult={ticketCode} />
            </div>
            <Button
                class="mt-6 w-full"
                on:click={handleSell}
                bind:disabled={disableButton}>Vendi</Button
            >
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

<Modal
    bind:open={modalOpen}
    onclose={closeModal}
    size="xs"
    outsideclose
    autoclose
>
    {@const ModalIcon = error ? XCircle : CheckCircle2}
    <span
        class="text-2xl font-semibold text-{color}-500 flex items-center gap-2"
    >
        <ModalIcon class="h-6 w-6  text-{color}-500" />
        {error ? "Errore" : "Successo"}
    </span>
    <div class="flex flex-col gap-5">
        <span class="text-xl font-medium text-gray-500">{modalMessage}</span>
        {#if !error}
            <div class="flex flex-col">
                <span class="mb-3">Codice: {ticketCode || ""}</span>
                <span>Nome: {name}</span>
                <span>Cognome: {surname}</span>
            </div>
        {/if}
    </div>
    <Button slot="footer" class="w-full" on:click={closeModal}>Chiudi</Button>
</Modal>
