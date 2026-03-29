<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as Card from "$lib/components/ui/card/index";
    import * as Progress from "$lib/components/ui/progress/index";

    import type { User } from "$lib/auth/user";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";
    import type { TicketsGenerationRequestBody } from "../../api/tickets/POST";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    $effect(() => {
        if (!$user) $user = data;
    });

    const currentYearShort = new Date().getFullYear() - 2000;
    let prefix = $state("FDP" + currentYearShort.toString() + "-");
    let suffix = $state("");
    let startingNumber = $state(1);
    let ticketCodeLength = $state(4);
    let fiscalMatrixPrefix = $state("XNRF");
    let fiscalMatrixStartingNumber = $state(35401);
    let fiscalMatrixSuffix = $state("/" + currentYearShort);
    let fiscalMatrixCodeLength = $state(5);
    let numberOfCodes = $state(1250);
    let codes: TicketsGenerationRequestBody = $state([]);
    let csvFile = $state<File | null>(null);

    let generationProgress = $state(0);
    let showGenerationProgress = $state(false);
    let csvProgress = $state(0);
    let showCsvProgress = $state(false);

    const insertCodes = async () => {
        generationProgress = 0;
        showGenerationProgress = true;
        codes = [];
        for (let i = 0; i < numberOfCodes; i++) {
            const ticketNumber = startingNumber + i;
            const fiscalMatrixNumber = fiscalMatrixStartingNumber + i;
            codes.push({
                ticketId: `${prefix}${ticketNumber.toString().padStart(ticketCodeLength, "0")}${suffix}`,
                fiscalMatrixNumber: `${fiscalMatrixPrefix}${fiscalMatrixNumber.toString().padStart(fiscalMatrixCodeLength, "0")}${fiscalMatrixSuffix}`,
            });
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
                body: JSON.stringify(chunk),
            });

            if (res.ok) {
                completedChunks++;
                generationProgress = (completedChunks / totalChunks) * 100;
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
                showGenerationProgress = false;
            }, 2000);
        }
    };

    const insertCodesFromCsv = async () => {
        if (!csvFile) {
            toast.error("Seleziona un file CSV");
            return;
        }

        const fileText = await csvFile.text();
        const lines = fileText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (!lines.length) {
            toast.error("Il file CSV e vuoto");
            return;
        }

        const parsedCodes: TicketsGenerationRequestBody = [];

        for (let i = 0; i < lines.length; i++) {
            const [ticketId, fiscalMatrixNumber] = lines[i].split(",").map((v) =>
                v.trim()
            );

            if (!ticketId || !fiscalMatrixNumber) {
                toast.error(`Riga ${i + 1} non valida: servono 2 colonne`);
                return;
            }

            parsedCodes.push({ ticketId, fiscalMatrixNumber });
        }

        csvProgress = 0;
        showCsvProgress = true;

        const totalChunks = Math.ceil(parsedCodes.length / 50);
        let completedChunks = 0;
        let error = false;

        for (let i = 0; i < parsedCodes.length; i += 50) {
            const chunk = parsedCodes.slice(i, i + 50);
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(chunk),
            });

            if (res.ok) {
                completedChunks++;
                csvProgress = (completedChunks / totalChunks) * 100;
            } else {
                error = true;
                break;
            }
        }

        if (error) {
            toast.error("Errore durante l'inserimento dei codici dal CSV");
        } else {
            toast.success("Codici da CSV inseriti con successo");
            setTimeout(() => {
                showCsvProgress = false;
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
                            <Label for="ticketCodeLength"
                                >Padding codice biglietto:</Label
                            >
                            <Input
                                id="ticketCodeLength"
                                type="number"
                                bind:value={ticketCodeLength}
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
                        
                    <div class="flex gap-8 mt-5">
                        <div>
                            <Label for="fiscalMatrixPrefix"
                                >Prefisso matrice:</Label
                            >
                            <Input
                                id="fiscalMatrixPrefix"
                                class="mt-2 text-center"
                                bind:value={fiscalMatrixPrefix}
                            />
                        </div>
                        <div>
                            <Label for="fiscalMatrixSuffix"
                                >Suffisso matrice:</Label
                            >
                            <Input
                                id="fiscalMatrixSuffix"
                                class="mt-2 text-center"
                                bind:value={fiscalMatrixSuffix}
                            />
                        </div>
                    </div>
                    <div class="flex gap-8 mt-5">
                        <div>
                            <Label for="fiscalMatrixCodeLength"
                                >Padding matrice:</Label
                            >
                            <Input
                                id="fiscalMatrixCodeLength"
                                type="number"
                                class="mt-2 text-center"
                                bind:value={fiscalMatrixCodeLength}
                            />
                        </div>
                        <div>
                            <Label for="fiscalMatrixStartingNumber"
                                >N° iniziale matrice:</Label
                            >
                            <Input
                                id="fiscalMatrixStartingNumber"
                                type="number"
                                class="mt-2 text-center"
                                bind:value={fiscalMatrixStartingNumber}
                            />
                        </div>
                    </div>
                    <div class="flex gap-8 mt-5">
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
                    </div>
                    <div class="flex w-full flex-col gap-3 py-2">
                        {#if showGenerationProgress}
                            <div
                                class="w-full flex items-center justify-between font-bold mt-5"
                            >
                                <span id="progress-label">
                                    Generazione in corso ...</span
                                >
                                <span>{generationProgress}%</span>
                            </div>
                            <Progress.Root
                                value={generationProgress}
                                max={100}
                                class="h-2 bg-app-accent/20 mb-5"
                                indicatorClass="bg-app-accent"
                            />
                        {/if}
                        <span class="text-sm font-medium rtl:text-right mt-2">
                            Formato codici: <b class=""
                                >{prefix}{startingNumber
                                    ?.toString()
                                    .padStart(ticketCodeLength, "0")}{suffix}</b
                            >
                        </span>
                        <span class="text-sm font-medium rtl:text-right">
                            Formato matrice fiscale:
                            <b class="">
                                {fiscalMatrixPrefix}{fiscalMatrixStartingNumber
                                    ?.toString()
                                    .padStart(fiscalMatrixCodeLength, "0")}{fiscalMatrixSuffix}
                            </b>
                        </span>
                        <span class="text-sm font-medium rtl:text-right">
                            Cliccando qui sotto verranno generati e inseriti nel
                            database i codici da
                            <span
                                class="text-sm font-medium text-app-accent rtl:text-right"
                            >
                                {prefix}{startingNumber
                                    ?.toString()
                                    .padStart(ticketCodeLength, "0")}{suffix}
                            </span>
                            a
                            <span
                                class="text-sm font-medium text-app-accent rtl:text-right"
                            >
                                {prefix}{(startingNumber + numberOfCodes - 1)
                                    ?.toString()
                                    .padStart(ticketCodeLength, "0")}{suffix}
                            </span>
                        </span>
                        <span class="text-sm font-medium rtl:text-right">
                            Associati a matrici fiscali da
                            <span
                                class="text-sm font-medium text-app-accent rtl:text-right"
                            >
                                {fiscalMatrixPrefix}{fiscalMatrixStartingNumber
                                    ?.toString()
                                    .padStart(fiscalMatrixCodeLength, "0")}{fiscalMatrixSuffix}
                            </span>
                            a
                            <span
                                class="text-sm font-medium text-app-accent rtl:text-right"
                            >
                                {fiscalMatrixPrefix}{(fiscalMatrixStartingNumber +
                                    numberOfCodes -
                                    1)
                                    ?.toString()
                                    .padStart(fiscalMatrixCodeLength, "0")}{fiscalMatrixSuffix}
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
                    Da questa card puoi inserire un CSV che contiene 2 colonne senza intestazione: 
                    la prima con i codici dei biglietti e la seconda con i corrispettivi numeri di matrice fiscale.
                </p>
                <div class="flex w-full flex-col gap-4 p-2">
                    <Input
                        type="file"
                        accept=".csv"
                        onchange={(event) => {
                            const target = event.currentTarget as HTMLInputElement;
                            csvFile = target.files?.[0] ?? null;
                        }}
                    />
                    <Button onclick={insertCodesFromCsv}
                        >Inserisci Codici da file</Button
                    >
                    {#if showCsvProgress}
                        <div
                            class="w-full flex items-center justify-between font-bold mt-2"
                        >
                            <span>Caricamento CSV in corso ...</span>
                            <span>{csvProgress}%</span>
                        </div>
                        <Progress.Root
                            value={csvProgress}
                            max={100}
                            class="h-2 bg-app-accent/20"
                            indicatorClass="bg-app-accent"
                        />
                    {/if}
                </div>
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
