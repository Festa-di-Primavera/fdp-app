<script lang="ts">
    import { enhance } from "$app/forms";
    import {
        Button,
        Card,
        Fileupload,
        Input,
        Label,
        Progressbar,
    } from "flowbite-svelte";
    import { sineOut } from "svelte/easing";

    import type { User } from "$lib/auth/user";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    // prefisso = FDP24 se 2024, FDP25 se 2025, ecc.
    let prefix = $state(
        "FDP" + (new Date().getFullYear() - 2000).toString() + "-"
    );
    let suffix = $state("");
    let startingNumber = $state(1);
    let codeLength = $state(4);
    let numberOfCodes = $state(1250);
    let codes: string[] = [];

    let progress = $state(0);
    let showProgress = $state(false);

    const insertCodes = async () => {
        progress = 0;
        showProgress = true;
        codes = [];
        for (let i = startingNumber; i < startingNumber + numberOfCodes; i++) {
            codes.push(
                prefix + i?.toString().padStart(codeLength, "0") + suffix
            );
        }

        const totalChunks = Math.ceil(codes.length / 50);
        let completedChunks = 0;
        let error = false;

        for (let i = 0; i < codes.length; i += 50) {
            const chunk = codes.slice(i, i + 50);
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ codes: chunk }),
            });

            if (res.ok) {
                completedChunks++;
                progress = (completedChunks / totalChunks) * 100;
            } else {
                error = true;
                break;
            }
        }

        if (error) {
            toast.error("Errore durante l'inserimento dei codici");
        } else {
            toast.success("Codici inseriti con successo");
        }
    };

    let ticketsNumber = $state(1250);
    let ticketsPerBlock = $state(50);
    let startCode = $state(45151);
    let isNotDivisibile = $derived(ticketsNumber % ticketsPerBlock != 0);

    const insertBlocks = async () => {
        const res = await fetch("/api/tickets/blocks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ticketsNumber, ticketsPerBlock, startCode }),
        });
        let error = true;
        if (res.ok) {
            error = false;
        }
        const message = (await res.json()).message;
        if (error) {
            toast.error(message);
        } else {
            toast.success(message);
        }
    };
</script>

<svelte:head>
    <title>Genera</title>
</svelte:head>

<section
    class="flex h-full w-full flex-grow flex-wrap items-start justify-center gap-4 py-6 px-6"
>
    <Card class="dark:bg-neutral-900 dark:border-neutral-600 p-10">
        <div class="flex w-full max-w-96 flex-grow flex-col items-start gap-2">
            <h1 class="text-4xl font-bold text-primary-600">
                Genera Biglietti
            </h1>
            <p class="text-justify dark:text-white">
                Da questa card puoi generare i biglietti e inserirli nel
                sistema.
            </p>
            <main class="w-full text-center">
                <div class="flex gap-8">
                    <Label class="flex flex-col items-start py-4">
                        Prefisso:
                        <Input
                            class="mt-2 text-center dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                            bind:value={prefix}
                            placeholder={"FDP" +
                                (new Date().getFullYear() - 2000)?.toString() +
                                "-"}
                        />
                    </Label>
                    <Label class="flex flex-col items-start py-4">
                        Suffisso:
                        <Input
                            class="mt-2 text-center dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                            bind:value={suffix}
                        />
                    </Label>
                </div>
                <div class="flex gap-8">
                    <Label class="flex flex-col items-start gap-4 py-4">
                        N° cifre del codice:
                        <Input
                            type="number"
                            bind:value={codeLength}
                            class="dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                        />
                    </Label>
                    <Label class="flex flex-col items-start gap-4 py-4">
                        Quantità di codici:
                        <Input
                            type="number"
                            bind:value={numberOfCodes}
                            class="dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                        />
                    </Label>
                    <Label class="flex flex-col items-start gap-4 py-4">
                        Numero di partenza:
                        <Input
                            type="number"
                            bind:value={startingNumber}
                            class="dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                        />
                    </Label>
                </div>
                <div class="flex w-full flex-col gap-3 py-2">
                    {#if showProgress}
                        <Progressbar
                            {progress}
                            animate
                            precision={2}
                            size="h-4"
                            labelInside
                            tweenDuration={1500}
                            easing={sineOut}
                        />
                    {/if}
                    <span
                        class="text-sm font-medium text-gray-900 dark:text-gray-300 rtl:text-right"
                    >
                        Formato codici: <b class=""
                            >{prefix}{startingNumber
                                ?.toString()
                                .padStart(codeLength, "0")}{suffix}</b
                        >
                    </span>
                    <span
                        class="text-sm font-medium text-gray-900 dark:text-gray-300 rtl:text-right"
                    >
                        Cliccando qui sotto verranno generati e inseriti nel
                        database i codici da
                        <span
                            class="text-sm font-medium text-primary-700 dark:text-primary-300 rtl:text-right"
                        >
                            {prefix}{startingNumber
                                ?.toString()
                                .padStart(codeLength, "0")}{suffix}
                        </span>
                        a
                        <span
                            class="text-sm font-medium text-primary-700 dark:text-primary-300 rtl:text-right"
                        >
                            {prefix}{(startingNumber + numberOfCodes - 1)
                                ?.toString()
                                .padStart(codeLength, "0")}{suffix}
                        </span>
                    </span>
                    <Button onclick={insertCodes} class="rounded text-white"
                        >Inserisci Codici</Button
                    >
                </div>
            </main>
        </div>
    </Card>
    <Card class="dark:bg-neutral-900 dark:border-neutral-600">
        <div class="flex w-full max-w-96 flex-grow flex-col items-start gap-2">
            <h1 class="text-4xl font-bold text-primary-600">
                Inserisci da file
            </h1>
            <p class="text-justify dark:text-white">
                Da questa card puoi inserire un CSV che contiene un codice per
                riga se il generatore non soddisfa i requisiti.
            </p>
            <form
                method="post"
                use:enhance
                enctype="multipart/form-data"
                class="flex w-full flex-col gap-4"
            >
                <Fileupload
                    name="fileToUpload"
                    size="sm"
                    class="mt-4 p-0 w-full dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400 [&::file-selector-button]:!bg-neutral-600 [&::file-selector-button]:!hover:bg-neutral-700"
                    accept=".csv"
                />
                <Button type="submit">Inserisci Codici da file</Button>
            </form>
        </div>
    </Card>
    <Card class="dark:bg-neutral-900 dark:border-neutral-600 p-10">
        <div class="flex w-full max-w-96 flex-grow flex-col items-start gap-2">
            <h1 class="text-4xl font-bold text-primary-600">
                Genera Blocchetti
            </h1>
            <p class="text-justify dark:text-white">
                Da questa card puoi generare i blocchi di biglietti da assegnare
                ai venditori.<br /><br />
                <b class="text-primary-300">Attenzione:</b> i blocchetti già presenti
                nel database verranno cancellati e sostituiti con i nuovi.
            </p>
            <main class="w-full text-center">
                <div class="flex gap-8">
                    <Label class="flex flex-col items-start gap-4 py-4">
                        N° biglietti già inseriti:
                        <Input
                            type="number"
                            bind:value={ticketsNumber}
                            class="dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                        />
                    </Label>
                    <Label class="flex flex-col items-start gap-4 py-4">
                        N° biglietti per blocco:
                        <Input
                            type="number"
                            bind:value={ticketsPerBlock}
                            class="dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                        />
                    </Label>
                    <Label class="flex flex-col items-start gap-4 py-4">
                        Codice di partenza:
                        <Input
                            type="number"
                            bind:value={startCode}
                            class="dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                        />
                    </Label>
                </div>
                <div class="flex w-full flex-col gap-3 py-2">
                    {#if isNotDivisibile}
                        <span class="text-sm"
                            ><b class="text-primary-300">{ticketsNumber}</b>
                            non è divisibile per
                            <b class="text-primary-300">{ticketsPerBlock}</b>
                        </span>
                    {:else}
                        <span class="text-sm"
                            >Verranno generati <b class="text-primary-300"
                                >{ticketsNumber / ticketsPerBlock}</b
                            >
                            blocchetti da
                            <b class="text-primary-300">{ticketsPerBlock}</b> biglietti</span
                        >
                    {/if}
                    <Button
                        onclick={insertBlocks}
                        class="rounded text-white"
                        disabled={isNotDivisibile}>Genera Blocchetti</Button
                    >
                </div>
            </main>
        </div>
    </Card>
</section>
