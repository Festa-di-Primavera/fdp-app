<script lang="ts">
    import {
        Button,
        Card,
        Checkbox,
        Input,
        Label,
        Modal,
        Radio,
        Spinner,
    } from "flowbite-svelte";
    import {
        Check,
        CheckCircle2,
        Minus,
        PencilLine,
        Plus,
        Send,
        Ticket as TicketIcon,
        Trash2,
        X,
        XCircle,
    } from "lucide-svelte";

    import QrReader from "$components/QrReader.svelte";
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import { getXnrfCode } from "$lib/utils/tickets";
    import {
        type Order,
        type OrderItem,
        BaseIngredient,
        DEFAULT_INGREDIENTS,
        ItemType,
        Sauce,
    } from "$models/order";
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
    let open: boolean = $state(false);
    let errorMessage: string = $state("Codice biglietto errato");

    let timeOut: NodeJS.Timeout;

    async function getTicket(code: string) {
        const res = await fetch(`/api/tickets/${encodeURIComponent(code)}`);
        ticketCodeInput = "";

        if (res.status == 404 || res.status == 402 || res.status == 425) {
            errorMessage =
                res.status === 402
                    ? "Biglietto non ancora venduto"
                    : res.status === 425
                      ? "Biglietto non ancora validato all'ingresso"
                      : "Codice biglietto errato";
            open = true;

            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                open = false;
                clearTimeout(timeOut);
            }, 3500);
            return;
        }

        let ticketResponse = (await res.json()).ticket;

        ticket = {
            ticketId: getXnrfCode(code) || "",
            name: ticketResponse.name,
            surname: ticketResponse.surname,
            seller: res.status !== 206 ? ticketResponse.seller : "Non Trovato",
            soldAt: ticketResponse.soldAt,
            checkIn: ticketResponse.checkIn,
        };
    }

    const reset = () => {
        ticket = undefined;
        ticketCodeInput = "";
        ticketCode = "";
        open = false;
    };

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

    let orderItems: OrderItem[] = $state([]);
    let showModal = $state(false);
    let currentItem: OrderItem = $state({
        type: ItemType.ONTO,
        quantity: 1,
        removedIngredients: [],
        addedSauces: [],
    });

    let isEditing = $state(false);
    let editingIndex = $state(-1);

    function openOrderModal(type: string) {
        currentItem = {
            type: type as ItemType,
            quantity: 1,
            removedIngredients: [],
            glutenFree: false,
        };
        isEditing = false;
        showModal = true;
    }

    function areOrderItemsEqual(a: OrderItem, b: OrderItem): boolean {
        return (
            a.type === b.type &&
            a.glutenFree === b.glutenFree &&
            JSON.stringify(a.removedIngredients?.sort()) ===
                JSON.stringify(b.removedIngredients?.sort())
        );
    }

    function removeFromOrder(displayIndex: number) {
        // Converte l'indice di display nell'indice effettivo nell'array
        const actualIndex = orderItems.length - 1 - displayIndex;
        orderItems = orderItems.filter((_, i) => i !== actualIndex);
    }

    function editOrder(displayIndex: number) {
        // Converte l'indice di display nell'indice effettivo nell'array
        const actualIndex = orderItems.length - 1 - displayIndex;
        currentItem = { ...orderItems[actualIndex] };
        isEditing = true;
        editingIndex = actualIndex;
        showModal = true;
    }

    function addToOrder() {
        if (isEditing) {
            // In modalità modifica, mantieni la posizione originale
            orderItems = orderItems.map((item, index) =>
                index === editingIndex ? { ...currentItem } : item
            );
        } else {
            // Cerca un ordine identico esistente
            const existingIndex = orderItems.findIndex((item) =>
                areOrderItemsEqual(item, currentItem)
            );

            if (existingIndex !== -1) {
                // Aggiorna la quantità dell'ordine esistente
                orderItems = orderItems.map((item, index) =>
                    index === existingIndex
                        ? {
                              ...item,
                              quantity: item.quantity + currentItem.quantity,
                          }
                        : item
                );
            } else {
                // Aggiungi nuovo ordine
                orderItems = [...orderItems, { ...currentItem }];
            }
        }
        showModal = false;
        isEditing = false;
        editingIndex = -1;
    }

    let orderSubmitError: boolean = $state(true);
    let orderFeedbackMessage: string = $state("");

    async function submitOrder() {
        try {
            const finalOrder: Order = {
                ticketId: ticket?.ticketId || "",
                name: `${ticket?.name}`,
                surname: ticket?.surname || "",
                items: orderItems,
                done: false,
                creationDate: new Date(Date.now())
            };
            const response = await fetch("/api/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(finalOrder),
            });

            if (!response.ok) {
                throw new Error("Errore durante l'invio dell'ordine");
            }

            orderFeedbackMessage = (await response.json()).message;
            orderSubmitError = false;
            // clear order on success
            orderItems = [];
            // reset all state
            reset();
        } catch (error) {
            console.error("Error submitting order:", error);
            orderFeedbackMessage = "Errore durante l'invio dell'ordine";
            orderSubmitError = true;
        }
        open = true;
        clearTimeout(timeOut);
        timeOut = setTimeout(() => {
            open = false;
            orderFeedbackMessage = "";
            orderSubmitError = true;
            clearTimeout(timeOut);
        }, 3500);
    }

    function adjustQuantity(increment: boolean) {
        if (increment) {
            currentItem.quantity++;
        } else if (currentItem.quantity > 1) {
            currentItem.quantity--;
        }
    }
</script>

<svelte:head>
    <title>Cassa</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        {#if $user}
            <h1 class="text-4xl font-bold text-primary-600">Cassa</h1>
            <p class="text-justify dark:text-white">
                Scansionare il QR e prendere l'ordine del cliente per inviarlo
                in cucina.
            </p>
            <div class="w-full">
                {#if !ticket}
                    <Label
                        class="text-md font-medium text-black dark:text-white"
                    >
                        Codice Biglietto <span class="text-primary-700">*</span>
                        <Input
                            required
                            class="mt-1"
                            bind:value={ticketCodeInput}
                            name="code"
                            autocomplete="off"
                            onkeypress={onKeyDown}
                        >
                            <TicketIcon
                                class="h-6 w-6 text-primary-600 dark:text-white"
                                slot="left"
                            />

                            <div
                                class="flex h-full items-center gap-2"
                                slot="right"
                            >
                                {#if ticketCodeInput !== ""}
                                    <button
                                        onclick={() =>
                                            getTicket(ticketCodeInput)}
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
                {:else}
                    <div class="flex flex-col gap-5">
                        <Card
                            class="w-full flex flex-col text-lg p-3"
                            id="ticketInfos"
                        >
                            <span
                                class="text-black dark:text-white w-full flex justify-between"
                            >
                                <span>N° biglietto:</span>
                                <span class="font-mono">
                                    <b>{ticket.ticketId}</b>
                                </span>
                            </span>
                            <span
                                class="text-black dark:text-white w-full flex justify-between"
                            >
                                <span>Nominativo:</span>
                                <span
                                    >{(ticket?.name || "") +
                                        " " +
                                        (ticket?.surname || "")}</span
                                >
                            </span>
                            <div class="flex justify-between mt-3">
                                <button
                                    class="text-sm text-primary-400 hover:text-primary-500"
                                    onclick={reset}
                                >
                                    Modifica codice
                                </button>
                                {#if orderItems.length > 0}
                                    <Button
                                        class="text-sm flex items-center gap-2"
                                        onclick={submitOrder}
                                    >
                                        <Send class="w-4 h-4" />
                                        Invia ordine
                                    </Button>
                                {/if}
                            </div>
                        </Card>
                        <div class="flex gap-3 justify-around flex-wrap">
                            {#each Object.values(ItemType) as type}
                                <button
                                    onclick={() => openOrderModal(type)}
                                    class="flex-grow"
                                >
                                    <Card class="w-full" padding="sm"
                                        >{type}</Card
                                    >
                                </button>
                            {/each}
                        </div>
                        {#if orderItems.length > 0}
                            <div class="mt-4 flex flex-col gap-3">
                                <h3
                                    class="text-lg font-semibold dark:text-white"
                                >
                                    Ordine corrente:
                                </h3>
                                {#each [...orderItems].reverse() as item, i}
                                    <Card padding="sm" class="relative">
                                        <div
                                            class="absolute right-2 top-2 flex gap-2"
                                        >
                                            <button
                                                class="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                onclick={() => editOrder(i)}
                                            >
                                                <PencilLine
                                                    class="w-5 h-5 text-blue-500"
                                                />
                                            </button>
                                            <button
                                                class="p-1 hover:bg-red-100 rounded-full transition-colors"
                                                onclick={() =>
                                                    removeFromOrder(i)}
                                            >
                                                <Trash2
                                                    class="w-5 h-5 text-red-500"
                                                />
                                            </button>
                                        </div>
                                        <div class="pr-20">
                                            <!-- Increased right padding to accommodate both buttons -->
                                            <div
                                                class="flex items-baseline gap-2 mb-1"
                                            >
                                                <span
                                                    class="font-medium text-lg"
                                                    >{item.type}</span
                                                >
                                                <span class="text-gray-600"
                                                    >x{item.quantity}</span
                                                >
                                                {#if item.glutenFree}
                                                    <span
                                                        class="text-sm text-orange-300"
                                                        >(Senza glutine)</span
                                                    >
                                                {/if}
                                            </div>
                                            {#if item.removedIngredients?.length}
                                                <div
                                                    class="text-sm text-red-500"
                                                >
                                                    Senza: {item.removedIngredients.join(
                                                        ", "
                                                    )}
                                                </div>
                                            {/if}
                                        </div>
                                    </Card>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <FeedbackToast
                    bind:open
                    color={orderSubmitError ? "red" : "green"}
                    ToastIcon={orderSubmitError ? XCircle : CheckCircle2}
                    message={orderFeedbackMessage || errorMessage}
                />
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

<Modal bind:open={showModal} size="md" class="z-50">
    <h2 class="text-xl font-bold" slot="header">
        Personalizza {currentItem.type}
    </h2>
    <div class="flex gap-3 mb-4 items-center">
        Quantità
        <div class="flex items-center gap-3">
            <button onclick={() => adjustQuantity(false)}>
                <Minus class="w-5 h-5" />
            </button>
            <Input
                bind:value={currentItem.quantity}
                class="w-12 text-center"
                type="number"
                min="1"
                max="100"
            />
            <button onclick={() => adjustQuantity(true)}>
                <Plus class="w-5 h-5" />
            </button>
        </div>
    </div>

    <div class="mb-4 flex flex-col">
        <Label class="flex items-center gap-2 mb-4">
            <Checkbox bind:checked={currentItem.glutenFree} />
            <span class="font-semibold text-orange-300">Senza glutine</span>
        </Label>

        {#if DEFAULT_INGREDIENTS[currentItem.type].length > 0}
            <span class="mb-2 text-red-500 font-bold">Rimuovi ingredienti:</span
            >
        {/if}
        {#each DEFAULT_INGREDIENTS[currentItem.type] as ingredient}
            <div class="flex items-center gap-2 p-1 rounded">
                <Label class="flex items-center gap-2">
                    <Checkbox
                        checked={currentItem.removedIngredients?.includes(
                            ingredient
                        )}
                        onchange={() => {
                            if (
                                currentItem.removedIngredients?.includes(
                                    ingredient
                                )
                            ) {
                                currentItem.removedIngredients =
                                    currentItem.removedIngredients.filter(
                                        (i: BaseIngredient) => i !== ingredient
                                    );
                            } else {
                                currentItem.removedIngredients = [
                                    ...(currentItem.removedIngredients || []),
                                    ingredient,
                                ];
                            }
                        }}
                    />
                    <span
                        class:line-through={currentItem.removedIngredients?.includes(
                            ingredient
                        )}
                        class:text-red-500={currentItem.removedIngredients?.includes(
                            ingredient
                        )}
                    >
                        {ingredient}
                    </span>
                </Label>
            </div>
        {/each}

        <span class="mb-2 text-green-500 font-bold">Aggiungi salse:</span>
        {#each Object.values(Sauce) as sauce}
            <div class="flex items-center gap-2 p-1 rounded">
                <Label class="flex items-center gap-2">
                    <Radio
                        name="sauce"
                        onchange={() => {
                            currentItem.sauce = sauce;
                        }}
                    />
                    <span class:text-green-500={currentItem.sauce === sauce}>
                        {sauce}
                    </span>
                </Label>
            </div>
        {/each}
    </div>

    <div class="flex justify-end gap-3">
        <Button color="alternative" onclick={() => (showModal = false)}
            >Annulla</Button
        >
        <Button color="primary" onclick={addToOrder}>
            {isEditing ? "Modifica" : "Aggiungi"}
        </Button>
    </div>
</Modal>
