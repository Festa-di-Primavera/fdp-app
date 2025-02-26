<script lang="ts">
    import {
        Button,
        Card,
        Input,
        Label,
        Spinner,
        Modal,
        Checkbox,
        Radio,
    } from "flowbite-svelte";
    import {
        Check,
        CheckCircle2,
        PencilLine,
        Send,
        Ticket as TicketIcon,
        Trash2,
        X,
        XCircle,
        Plus,
        Minus,
    } from "lucide-svelte";

    import QrReader from "$components/QrReader.svelte";
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import { getXnrfCode } from "$lib/utils/tickets";
    import {
        type Order,
        ItemType,
        BaseIngredient,
        DEFAULT_INGREDIENTS,
        Sauce,
        type OrderItem,
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

    let order: Order | undefined = $state();
    let open: boolean = $state(false);
    let errorMessage: string = $state("Codice biglietto errato");

    let timeOut: NodeJS.Timeout;

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
    let isOrderModified = $state(false);

    async function getOrder(code: string) {
        const res = await fetch(
            `/api/order/${encodeURIComponent(getXnrfCode(code)!!)}`
        );
        ticketCodeInput = "";

        if (res.status == 404 || res.status == 403 || res.status == 401) {
            errorMessage =
                res.status === 401
                    ? "Non autorizzato"
                    : res.status === 403
                      ? "Non hai i permessi per effettuare questa operazione"
                      : "Ordine non trovato";
            open = true;

            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                open = false;
                clearTimeout(timeOut);
            }, 3500);
            return;
        }

        const data = await res.json();
        order = data.order as Order;
        orderItems = order.items;
        isOrderModified = false;
    }

    function editOrder(displayIndex: number) {
        const actualIndex = orderItems.length - 1 - displayIndex;
        currentItem = { ...orderItems[actualIndex] };
        isEditing = true;
        editingIndex = actualIndex;
        showModal = true;
    }

    function saveItemChanges() {
        isOrderModified = true;
        orderItems = orderItems.map((item, index) =>
            index === editingIndex ? { ...currentItem } : item
        );
        showModal = false;
        isEditing = false;
        editingIndex = -1;
    }

    const reset = () => {
        order = undefined;
        ticketCodeInput = "";
        ticketCode = "";
        open = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && ticketCodeInput !== "") {
            getOrder(ticketCodeInput);
        }
    };

    $effect(() => {
        if (ticketCode !== "") {
            getOrder(ticketCode);
        } else {
            reset();
        }
    });

    let orderSubmitError: boolean = $state(true);
    let orderFeedbackMessage: string = $state("");

    async function submitOrder() {
        try {
            const response = await fetch("/api/order", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order!!.ticketId,
                    done: false,
                    timestamp: Date.now(),
                    ...(isOrderModified && { items: orderItems }),
                }),
            });

            if (!response.ok) {
                throw new Error("Errore durante l'invio dell'ordine");
            }

            orderFeedbackMessage = "Ordine inviato con successo";
            orderSubmitError = false;
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
</script>

<svelte:head>
    <title>Check Point</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        {#if $user}
            <h1 class="text-4xl font-bold text-primary-600">Check Point</h1>
            <p class="text-justify dark:text-white">
                Scansionare il QR. L'ordine arriverà direttamente in cucina.
            </p>
            <div class="w-full">
                {#if !order}
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
                                            getOrder(ticketCodeInput)}
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
                        <Card class="w-full text-lg p-3" id="orderInfos">
                            <div class="flex justify-between items-center">
                                <span class="text-black dark:text-white w-max">
                                    <span>Cliente:</span>
                                    <span>{order.name}</span>
                                </span>
                                <Button
                                    class="text-sm flex items-center gap-2"
                                    onclick={submitOrder}
                                >
                                    <Send class="w-4 h-4" />
                                    Invia
                                </Button>
                            </div>
                        </Card>

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
                                            <div class="text-sm text-green-600">
                                                Salsa: {item.sauce ||
                                                    "No salsa"}
                                            </div>
                                            <!-- TODO: remove -->
                                            {#if item.notes}
                                                <div
                                                    class="text-sm text-red-500"
                                                >
                                                    Note: {item.notes}
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
    <h2 class="text-xl font-bold" slot="header">Modifica Ordine</h2>

    <div class="mb-4 flex flex-col gap-4">
        <!-- Selezione tipo -->
        <div>
            <span class="font-semibold mb-2 block">Tipo:</span>
            <div class="grid grid-cols-3 gap-2">
                {#each Object.values(ItemType) as type}
                    <Card
                        class="w-full cursor-pointer flex flex-row gap-2 items-center"
                        onclick={() => (currentItem.type = type)}
                    >
                        {#if currentItem.type === type}
                            <CheckCircle2 class="w-6 h-6 text-green-500" />
                        {/if}
                        {type}
                    </Card>
                {/each}
            </div>
        </div>

        <Label class="flex items-center gap-2">
            <Checkbox bind:checked={currentItem.glutenFree} />
            <span class="font-semibold text-orange-300">Senza glutine</span>
        </Label>

        {#if DEFAULT_INGREDIENTS[currentItem.type]?.length > 0}
            <div>
                <span class="font-semibold text-red-500 block mb-2"
                    >Rimuovi ingredienti:</span
                >
                {#each DEFAULT_INGREDIENTS[currentItem.type] as ingredient}
                    <Label class="flex items-center gap-2 p-1">
                        <Checkbox
                            checked={currentItem.removedIngredients?.includes(
                                ingredient
                            )}
                            on:change={() => {
                                if (
                                    currentItem.removedIngredients?.includes(
                                        ingredient
                                    )
                                ) {
                                    currentItem.removedIngredients =
                                        currentItem.removedIngredients.filter(
                                            (i) => i !== ingredient
                                        );
                                } else {
                                    currentItem.removedIngredients = [
                                        ...(currentItem.removedIngredients ||
                                            []),
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
                {/each}
            </div>
        {/if}

        <div>
            <span class="font-semibold text-green-500 block mb-2">Salsa:</span>
            <div class="grid gap-2">
                <Label class="flex items-center gap-2 p-1 w-max">
                    <Radio
                        name="sauce"
                        checked={!currentItem.sauce}
                        on:change={() => (currentItem.sauce = undefined)}
                    />
                    <span>No salsa</span>
                </Label>
                {#each Object.values(Sauce) as sauce}
                    <Label class="flex items-center gap-2 p-1">
                        <Radio
                            name="sauce"
                            checked={currentItem.sauce === sauce}
                            on:change={() => (currentItem.sauce = sauce)}
                        />
                        <span>{sauce}</span>
                    </Label>
                {/each}
            </div>
        </div>

        <div>
            <span class="font-semibold text-red-500 block mb-2">Note:</span>
            <Input
                type="text"
                bind:value={currentItem.notes}
                placeholder="Inserisci eventuali note..."
            />
        </div>
    </div>

    <div class="flex justify-end gap-3">
        <Button color="alternative" onclick={() => (showModal = false)}
            >Annulla</Button
        >
        <Button color="primary" onclick={saveItemChanges}
            >Salva modifiche</Button
        >
    </div>
</Modal>
