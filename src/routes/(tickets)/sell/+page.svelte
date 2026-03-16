<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { CircleCheck, CircleX } from "@lucide/svelte";

    import QrReader from "$components/QrReader.svelte";
    import type { User } from "$lib/auth/user";
    import { getFdPOrStaffCode } from "$lib/utils/tickets";
    import { user } from "$store/store";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    $effect(() => {
        if (!$user) $user = data;
    });

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
            ticketCode = getFdPOrStaffCode(ticketCode?.trim()) ?? "";

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

<section class="flex h-full w-full grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        <h1 class="text-4xl font-bold text-app-accent">Vendi</h1>
        <p class="text-justify">
            Inserire nome, cognome e, scansionando il QR, il codice del
            biglietto.
        </p>

        <div class="flex flex-col w-full gap-2">
            <div>
                <Label class="text-md w-full font-medium" for="name">
                    Nome Ospite <span class="text-app-accent">*</span>
                </Label>
                <Input
                    id="name"
                    bind:value={name}
                    autocomplete="off"
                    onkeypress={onKeyDown}
                />
            </div>
            <div>
                <Label class="text-md w-full font-medium " for="surname">
                    Cognome Ospite <span class="text-app-accent">*</span>
                </Label>
                <Input
                    id="surname"
                    bind:value={surname}
                    autocomplete="off"
                    onkeypress={onKeyDown}
                />
            </div>
            <div>
                <Label class="text-md w-full font-medium" for="ticketCodeInput">
                    Codice Biglietto <span class="text-app-accent">*</span>
                </Label>
                <Input
                    required
                    bind:value={ticketCode}
                    id="ticketCodeInput"
                    autocomplete="off"
                    onkeypress={onKeyDown}
                    placeholder={"FDP" +
                        new Date().getFullYear().toString().slice(-2) +
                        "-XXXX"}
                />
            </div>
        </div>

        <div class="mt-2 flex w-full items-center justify-center">
            <QrReader bind:codeResult={ticketCode} />
        </div>
        <Button
            class="mt-2 w-full"
            onclick={handleSell}
            disabled={disableButton}>Vendi</Button
        >
    </div>
</section>

<Dialog.Root bind:open={modalOpen}>
    <Dialog.Content
        onOpenAutoFocus={(e) => {
            e.preventDefault();
        }}
    >
        {@const ModalIcon = error ? CircleX : CircleCheck}
        <Dialog.Title
            class="text-2xl font-semibold {color === 'green'
                ? 'text-green-500'
                : 'text-red-500'} flex items-center gap-2"
        >
            <ModalIcon class="h-6 w-6" />
            {error ? "Errore" : "Successo"}
        </Dialog.Title>
        <Dialog.Description class="flex flex-col gap-5">
            <span class="text-xl font-medium text-neutral-200"
                >{modalMessage}</span
            >
            {#if !error}
                <div class="flex flex-col">
                    <span class="mb-2">Codice: {ticketCode || ""}</span>
                    <span>Nome: {name}</span>
                    <span>Cognome: {surname}</span>
                </div>
            {/if}
        </Dialog.Description>
        <div class="flex justify-end pt-4">
            <Button class="w-full" onclick={closeModal}>Chiudi</Button>
        </div>
    </Dialog.Content>
</Dialog.Root>
