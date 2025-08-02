<script lang="ts">
    import {
        BaseIngredient,
        DEFAULT_INGREDIENTS,
        Sauce,
        type OrderItem,
    } from "$models/order";
    import {
        Button,
        Checkbox,
        Input,
        Label,
        Modal,
        Radio,
    } from "flowbite-svelte";
    import { Minus, Plus } from "@lucide/svelte";

    interface Props {
        showModal: boolean;
        currentItem: OrderItem;
        isEditing: boolean;
        hasQty?: boolean;
        hasSauce?: boolean;
        addToOrder: () => void;
        adjustQuantity: (increase: boolean) => void;
    }

    let {
        showModal = $bindable(false),
        currentItem = $bindable({} as OrderItem),
        isEditing = $bindable(false),
        hasQty = true,
        hasSauce = true,
        addToOrder,
        adjustQuantity,
    }: Props = $props();
</script>

<Modal
    bind:open={showModal}
    size="md"
    class="z-50 dark:bg-neutral-800 dark:divide-neutral-500 dark:text-neutral-300"
    headerClass="dark:bg-neutral-800 dark:text-neutral-300"
    footerClass="dark:bg-neutral-800 dark:text-neutral-300"
>
    {#snippet header()}
        <h2 class="text-xl font-bold">
            Personalizza {currentItem.type}
        </h2>
    {/snippet}
    {#if hasQty}
        <div class="flex gap-3 mb-4 items-center">
            Quantità
            <div class="flex items-center gap-3">
                <button onclick={() => adjustQuantity(false)}>
                    <Minus class="w-5 h-5" />
                </button>
                <Input
                    bind:value={currentItem.quantity}
                    class="w-12 text-center dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
                    type="number"
                    min="1"
                    max="100"
                />
                <button onclick={() => adjustQuantity(true)}>
                    <Plus class="w-5 h-5" />
                </button>
            </div>
        </div>
    {/if}

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

        {#if hasSauce}
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
                        <span
                            class:text-green-500={currentItem.sauce === sauce}
                        >
                            {sauce}
                        </span>
                    </Label>
                </div>
            {/each}
        {/if}
    </div>

    <div class="flex justify-end gap-3">
        <Button
            color="alternative"
            class="dark:text-neutral-400 dark:border-neutral-400 dark:hover:bg-neutral-700 dark:hover:border-neutral-300"
            onclick={() => (showModal = false)}>Annulla</Button
        >
        <Button color="primary" onclick={addToOrder}>
            {isEditing ? "Modifica" : "Aggiungi"}
        </Button>
    </div>
</Modal>
