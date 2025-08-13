<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import * as Card from "$lib/components/ui/card/index";
    import { Checkbox } from "$lib/components/ui/checkbox/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as RadioGroup from "$lib/components/ui/radio-group/index";
    import {
        Check,
        CircleCheck,
        PencilLine,
        Send,
        X
    } from "@lucide/svelte";

    import QrReader from "$components/QrReader.svelte";
    import type { User } from "$lib/auth/user";
    import { getXnrfCode } from "$lib/utils/tickets";
    import {
        DEFAULT_INGREDIENTS,
        ItemType,
        Sauce,
        type Order,
        type OrderItem,
    } from "$models/order";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: User;
    }

    let { data }: Props = $props();
    if (!$user) $user = data;

    let ticketCode: string = $state("");
    let ticketCodeInput: string = $state("");

    let order: Order | undefined = $state();

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

        const responseBody = await res.json();
        if (res.status == 404 || res.status == 403 || res.status == 401) {
            toast.error(responseBody.message);
            return;
        }

        order = responseBody.order as Order;
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

    async function submitOrder() {
        try {
            const response = await fetch("/api/order", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order!!.ticketId,
                    done: false,
                    creationDate: new Date(Date.now()),
                    ...(isOrderModified && { items: orderItems }),
                }),
            });

            if (!response.ok) {
                throw new Error("Errore durante l'invio dell'ordine");
            }

            toast.success((await response.json()).message);
            reset();
        } catch (error) {
            console.error("Error submitting order:", error);
            toast.error("Errore durante l'invio dell'ordine");
        }
    }
</script>

<svelte:head>
    <title>Check Point</title>
</svelte:head>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
    <div
        class="flex w-full max-w-96 flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5"
    >
        <h1 class="text-4xl font-bold text-app-accent">Check Point</h1>
        <p class="text-justify">
            Scansionare il QR. L'ordine arriverà direttamente in cucina.
        </p>
        <div class="w-full">
            {#if !order}
                <Label class="text-md font-medium" for="ticketCodeInput">
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
                    />
                    {#if ticketCodeInput !== ""}
                        <div class="flex h-full items-center gap-2">
                            <button onclick={() => getOrder(ticketCodeInput)}>
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
            {:else}
                <div class="flex flex-col gap-5">
                    <Card.Root id="orderInfos">
                        <Card.Content class="px-6 py-2">
                            <div class="flex justify-between items-center">
                                <span class="w-max">
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
                        </Card.Content>
                    </Card.Root>

                    {#if orderItems.length > 0}
                        <div class="mt-4 flex flex-col gap-3">
                            <h3 class="text-lg font-semibold">
                                Ordine corrente:
                            </h3>
                            {#each [...orderItems].reverse() as item, i}
                                <Card.Root class="relative">
                                    <Card.Content class="py-0 px-4">
                                        <div
                                            class="absolute right-4 top-8 flex gap-3"
                                        >
                                            <button
                                                class="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                                onclick={() => editOrder(i)}
                                            >
                                                <PencilLine
                                                    class="w-5 h-5 text-blue-400 hover:text-blue-500"
                                                />
                                            </button>
                                        </div>
                                        <div class="pr-20">
                                            <div
                                                class="flex flex-col gap-1 mb-2"
                                            >
                                                <div
                                                    class="flex items-baseline gap-2"
                                                >
                                                    <span
                                                        class="font-medium text-lg"
                                                        >{item.type}</span
                                                    >
                                                    <span class="text-app-accent"
                                                        >x{item.quantity}</span
                                                    >
                                                </div>
                                                {#if item.glutenFree}
                                                    <span
                                                        class="text-sm text-orange-300 font-bold"
                                                        >SENZA GLUTINE</span
                                                    >
                                                {/if}
                                            </div>
                                            {#if item.removedIngredients?.length}
                                                <div
                                                    class="text-sm text-red-400"
                                                >
                                                    <b>Senza:</b>
                                                    {item.removedIngredients.join(
                                                        ", "
                                                    )}
                                                </div>
                                            {/if}
                                            {#if item.sauce}
                                                <div
                                                    class="text-sm text-green-600"
                                                >
                                                    <b>Salsa:</b>
                                                    {item.sauce}
                                                </div>
                                            {/if}
                                            {#if item.notes}
                                                <div
                                                    class="text-sm text-red-400"
                                                >
                                                    <b>Note:</b>
                                                    {item.notes}
                                                </div>
                                            {/if}
                                        </div>
                                    </Card.Content>
                                </Card.Root>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</section>

<Dialog.Root bind:open={showModal}>
    <Dialog.Content class="max-w-md">
        <Dialog.Header>
            <Dialog.Title>Modifica Ordine</Dialog.Title>
        </Dialog.Header>
        <div class="mb-4 flex flex-col gap-4">
            <!-- Selezione tipo -->
            <div>
                <span class="font-semibold mb-2 block">Tipo:</span>
                <div class="flex gap-3 justify-around flex-wrap">
                    {#each Object.values(ItemType) as type}
                        <button
                            onclick={() => (currentItem.type = type)}
                            class="flex-grow"
                        >
                            <Card.Root
                                class="hover:bg-accent transition-colors {currentItem.type ===
                                type
                                    ? 'border-primary'
                                    : ''}"
                            >
                                <Card.Content
                                    class="px-4 text-center flex items-center justify-center gap-2"
                                >
                                    {#if currentItem.type === type}
                                        <CircleCheck
                                            class="w-5 h-5 text-green-500"
                                        />
                                    {/if}
                                    {type}
                                </Card.Content>
                            </Card.Root>
                        </button>
                    {/each}
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <Checkbox
                    id="glutenFree"
                    bind:checked={currentItem.glutenFree}
                />
                <Label
                    for="glutenFree"
                    class="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-orange-300"
                >
                    Senza glutine
                </Label>
            </div>

            {#if DEFAULT_INGREDIENTS[currentItem.type]?.length > 0}
                <div>
                    <span class="font-semibold text-red-400 block mb-2"
                        >Rimuovi ingredienti:</span
                    >
                    {#each DEFAULT_INGREDIENTS[currentItem.type] as ingredient}
                        <div class="flex items-center space-x-2 p-1">
                            <Checkbox
                                id={ingredient}
                                checked={currentItem.removedIngredients?.includes(
                                    ingredient
                                )}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        currentItem.removedIngredients = [
                                            ...(currentItem.removedIngredients ||
                                                []),
                                            ingredient,
                                        ];
                                    } else {
                                        currentItem.removedIngredients =
                                            currentItem.removedIngredients?.filter(
                                                (i) => i !== ingredient
                                            ) || [];
                                    }
                                }}
                            />
                            <Label
                                for={ingredient}
                                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {currentItem.removedIngredients?.includes(
                                    ingredient
                                )
                                    ? 'line-through text-red-400'
                                    : ''}"
                            >
                                {ingredient}
                            </Label>
                        </div>
                    {/each}
                </div>
            {/if}

            <div>
                <span class="font-semibold text-green-500 block mb-2"
                    >Salsa:</span
                >
                <RadioGroup.Root value={currentItem.sauce}>
                    {#each Object.values(Sauce) as sauce}
                        <div class="flex items-center space-x-2 p-1">
                            <RadioGroup.Item
                                id={sauce}
                                value={sauce}
                                onclick={() => {
                                    currentItem.sauce = sauce;
                                }}
                            />
                            <Label for={sauce} class="text-sm font-medium">
                                <span
                                    class:text-green-500={currentItem.sauce ===
                                        sauce}
                                >
                                    {sauce}
                                </span>
                            </Label>
                        </div>
                    {/each}
                </RadioGroup.Root>
            </div>

            <div>
                <span class="font-semibold text-red-400 block mb-2">Note:</span>
                <Input
                    type="text"
                    bind:value={currentItem.notes}
                    placeholder="Inserisci eventuali note..."
                />
            </div>
        </div>

        <Dialog.Footer class="flex justify-end gap-3">
            <Button variant="outline" onclick={() => (showModal = false)}
                >Annulla</Button
            >
            <Button onclick={saveItemChanges}>Salva modifiche</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
