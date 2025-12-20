<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as Card from "$lib/components/ui/card/index";
    import * as Progress from "$lib/components/ui/progress/index";
    import { sineOut } from "svelte/easing";

    import type { User } from "$lib/auth/user";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    $effect(() => {
        if (!$user) $user = data;
    });

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
            setTimeout(() => {
                showProgress = false;
            }, 2000);
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
    class="flex h-full w-full grow flex-wrap items-start justify-center gap-4 py-6 px-6"
>
    <Card.Root>
        <Card.Header>
            <Card.Title class="text-4xl font-bold text-app-accent">
                Genera Biglietti
            </Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="flex w-full max-w-96 grow flex-col items-start gap-2">
                <p class="text-justify">
                    Da questa card puoi generare i biglietti e inserirli nel
                    sistema.
                </p>
                <div class="w-full text-center mt-3">
                    <div class="flex gap-8">
                        <div>
                            <Label for="prefix">Prefisso:</Label>
                            <Input
                                id="prefix"
                                class="mt-2 text-center"
                                bind:value={prefix}
                                placeholder={"FDP" +
                                    (
                                        new Date().getFullYear() - 2000
                                    )?.toString() +
                                    "-"}
                            />
                        </div>
                        <div>
                            <Label for="suffix">Suffisso:</Label>
                            <Input
                                id="suffix"
                                class="mt-2 text-center"
                                bind:value={suffix}
                            />
                        </div>
                    </div>
                    <div class="flex gap-8 mt-5">
                        <div class="w-full">
                            <Label for="codeLength">N° cifre del codice:</Label>
                            <Input
                                id="codeLength"
                                type="number"
                                bind:value={codeLength}
                            />
                        </div>
                        <div class="w-full">
                            <Label for="numberOfCodes"
                                >Quantità di codici:</Label
                            >
                            <Input
                                id="numberOfCodes"
                                type="number"
                                bind:value={numberOfCodes}
                            />
                        </div>
                        <div class="w-full">
                            <Label for="startingNumber"
                                >Numero di partenza:</Label
                            >
                            <Input
                                id="startingNumber"
                                type="number"
                                bind:value={startingNumber}
                            />
                        </div>
                    </div>
                    <div class="flex w-full flex-col gap-3 py-2">
                        {#if showProgress}
                            <div
                                class="w-full flex items-center justify-between font-bold mt-5"
                            >
                                <span id="progress-label">
                                    Generazione in corso ...</span
                                >
                                <span>{progress}%</span>
                            </div>
                            <Progress.Root
                                value={progress}
                                max={100}
                                class="h-2 bg-app-accent/20 mb-5"
                                indicatorClass="bg-app-accent"
                            />
                        {/if}
                        <span class="text-sm font-medium rtl:text-right mt-2">
                            Formato codici: <b class=""
                                >{prefix}{startingNumber
                                    ?.toString()
                                    .padStart(codeLength, "0")}{suffix}</b
                            >
                        </span>
                        <span class="text-sm font-medium rtl:text-right">
                            Cliccando qui sotto verranno generati e inseriti nel
                            database i codici da
                            <span
                                class="text-sm font-medium text-app-accent rtl:text-right"
                            >
                                {prefix}{startingNumber
                                    ?.toString()
                                    .padStart(codeLength, "0")}{suffix}
                            </span>
                            a
                            <span
                                class="text-sm font-medium text-app-accent rtl:text-right"
                            >
                                {prefix}{(startingNumber + numberOfCodes - 1)
                                    ?.toString()
                                    .padStart(codeLength, "0")}{suffix}
                            </span>
                        </span>
                        <Button onclick={insertCodes}>Inserisci Codici</Button>
                    </div>
                </div>
            </div>
        </Card.Content>
    </Card.Root>
    <Card.Root>
        <Card.Header>
            <Card.Title class="text-4xl font-bold text-app-accent">
                Inserisci da file
            </Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="flex w-full max-w-96 grow flex-col items-start gap-2">
                <p class="text-justify dark:text-white">
                    Da questa card puoi inserire un CSV che contiene un codice
                    per riga se il generatore non soddisfa i requisiti.
                </p>
                <form
                    method="post"
                    use:enhance
                    enctype="multipart/form-data"
                    class="flex w-full flex-col gap-4 p-2"
                >
                    <Input type="file" name="fileToUpload" accept=".csv" />
                    <Button type="submit">Inserisci Codici da file</Button>
                </form>
            </div>
        </Card.Content>
    </Card.Root>
    <Card.Root>
        <Card.Header>
            <Card.Title class="text-4xl font-bold text-app-accent">
                Genera Blocchetti
            </Card.Title>
        </Card.Header>
        <Card.Content>
            <div class="flex w-full max-w-96 grow flex-col items-start gap-2">
                <p class="text-justify dark:text-white">
                    Da questa card puoi generare i blocchi di biglietti da
                    assegnare ai venditori.<br /><br />
                    <b class="text-amber-500">Attenzione:</b> i blocchetti già
                    presenti nel database verranno
                    <span class="text-destructive underline underline-offset-3"
                        >cancellati</span
                    > e sostituiti con i nuovi.
                </p>
                <main class="w-full text-center">
                    <div class="flex gap-8 mb-5">
                        <div>
                            <Label
                                class="flex flex-col items-start gap-4 py-4"
                                for="ticketsNumber"
                            >
                                N° biglietti già inseriti:
                            </Label>
                            <Input
                                id="ticketsNumber"
                                type="number"
                                bind:value={ticketsNumber}
                            />
                        </div>
                        <div>
                            <Label
                                class="flex flex-col items-start gap-4 py-4"
                                for="ticketsPerBlock"
                            >
                                N° biglietti per blocco:
                            </Label>
                            <Input
                                id="ticketsPerBlock"
                                type="number"
                                bind:value={ticketsPerBlock}
                            />
                        </div>
                        <div>
                            <Label
                                class="flex flex-col items-start gap-4 py-4"
                                for="startCode"
                            >
                                Codice di partenza:
                            </Label>
                            <Input
                                id="startCode"
                                type="number"
                                bind:value={startCode}
                            />
                        </div>
                    </div>
                    <div class="flex w-full flex-col gap-3 py-2">
                        {#if isNotDivisibile}
                            <span class="text-sm"
                                ><b class="text-destructive">{ticketsNumber}</b>
                                non è divisibile per
                                <b class="text-destructive">{ticketsPerBlock}</b
                                >
                            </span>
                        {:else}
                            <span class="text-sm"
                                >Verranno generati <b class="text-app-accent"
                                    >{ticketsNumber / ticketsPerBlock}</b
                                >
                                blocchetti da
                                <b class="text-app-accent">{ticketsPerBlock}</b>
                                biglietti</span
                            >
                        {/if}
                        <Button
                            onclick={insertBlocks}
                            disabled={isNotDivisibile}>Genera Blocchetti</Button
                        >
                    </div>
                </main>
            </div>
        </Card.Content>
    </Card.Root>
</section>
