<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import { Checkbox } from "$lib/components/ui/checkbox/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import {
        BaseIngredient,
        DEFAULT_INGREDIENTS,
        type OrderItem,
    } from "$models/order";
    import { Minus, Plus } from "@lucide/svelte";
    import { mode } from "mode-watcher";

    interface Props {
        showModal: boolean;
        currentItem: OrderItem;
        isEditing: boolean;
        hasQty?: boolean;
        addToOrder: () => void;
        adjustQuantity: (increase: boolean) => void;
    }

    let {
        showModal = $bindable(false),
        currentItem = $bindable({} as OrderItem),
        isEditing = $bindable(false),
        hasQty = true,
        addToOrder,
        adjustQuantity,
    }: Props = $props();
</script>

<Dialog.Root bind:open={showModal}>
    <Dialog.Content
        class="max-w-md"
        onOpenAutoFocus={(e) => {
            e.preventDefault();
        }}
    >
        <Dialog.Header>
            <Dialog.Title class="text-xl font-bold">
                Personalizza {currentItem.type}
            </Dialog.Title>
        </Dialog.Header>
        <Dialog.Description class="sr-only">
            Personalizza il tuo ordine modificando gli ingredienti e aggiungendo
            salse
        </Dialog.Description>

        {#if hasQty}
            <div class="flex gap-3 mb-4 items-center">
                Quantità
                <div class="flex items-center gap-3">
                    <button onclick={() => adjustQuantity(false)}>
                        <Minus class="w-5 h-5" />
                    </button>
                    <Input
                        bind:value={currentItem.quantity}
                        class="w-12 text-center"
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        oninput={(e: Event) => {
                            const input = e.target as HTMLInputElement;
                            // Consenti solo numeri e limita tra 1 e 100
                            input.value = input.value.replace(/\D/g, "");
                            let val = +input.value || 1;
                            if (val < 1) val = 1;
                            if (val > 100) val = 100;
                            input.value = val.toString();
                            currentItem.quantity = val;
                        }}
                    />
                    <button onclick={() => adjustQuantity(true)}>
                        <Plus class="w-5 h-5" />
                    </button>
                </div>
            </div>
        {/if}

        <div class="mb-4 flex flex-col">
            <span class="flex items-center gap-2 mb-2">
                <Checkbox
                    bind:checked={currentItem.glutenFree}
                    id="gluten-free"
                />
                <Label for="gluten-free">
                    <span
                        class="font-semibold {mode.current === 'dark'
                            ? 'text-orange-300'
                            : 'text-orange-500'}"
                    >
                        Senza glutine
                    </span>
                </Label>
            </span>

            {#if DEFAULT_INGREDIENTS[currentItem.type].length > 0}
                <span class="mb-2 text-red-400 font-bold"
                    >Rimuovi ingredienti:</span
                >
            {/if}
            <div class="flex flex-col justify-center gap-2 mb-3">
                {#each DEFAULT_INGREDIENTS[currentItem.type] as ingredient}
                    <div class="flex items-center gap-2">
                        <Checkbox
                            id={ingredient}
                            checked={currentItem.removedIngredients?.includes(
                                ingredient
                            )}
                            onCheckedChange={() => {
                                if (
                                    currentItem.removedIngredients?.includes(
                                        ingredient
                                    )
                                ) {
                                    currentItem.removedIngredients =
                                        currentItem.removedIngredients.filter(
                                            (i: BaseIngredient) =>
                                                i !== ingredient
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
                        <Label for={ingredient}>
                            <span
                                class:line-through={currentItem.removedIngredients?.includes(
                                    ingredient
                                )}
                                class:text-red-400={currentItem.removedIngredients?.includes(
                                    ingredient
                                )}
                            >
                                {ingredient}
                            </span>
                        </Label>
                    </div>
                {/each}
            </div>
        </div>

        <Dialog.Footer>
            <div class="flex justify-end gap-3 w-full">
                <Button variant="outline" onclick={() => (showModal = false)}
                    >Annulla</Button
                >
                <Button onclick={addToOrder}>
                    {isEditing ? "Modifica" : "Aggiungi"}
                </Button>
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
