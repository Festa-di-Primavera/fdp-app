<script lang="ts">
    import type { User } from "$lib/auth/user";
    import * as Avatar from "$lib/components/ui/avatar/index";
    import { Badge } from "$lib/components/ui/badge/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { Input } from "$lib/components/ui/input/index";
    import * as Table from "$lib/components/ui/table/index";
    import { formatDate } from "$lib/utils/textFormat";
    import { type Block } from "$lib/utils/tickets";
    import { user } from "$store/store";
    import { Search, UserCog, UserMinus, UserPlus } from "@lucide/svelte";
    import { toast } from "svelte-sonner";

    interface Props {
        data: { user: User; sellers: User[]; blockList: Block[] };
    }

    let { data }: Props = $props();
    if (!$user) $user = data.user;

    const addBlock = async (ticketCode: string, seller: User | null) => {
        try {
            const resp = await fetch(
                `/api/tickets/blocks/${seller?.id}/${encodeURIComponent(ticketCode)}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (resp.ok) {
                blockList = blockList.map((block) => {
                    if (block.id === ticketCode) {
                        block.assigned_to = seller;
                        block.assigned_by = $user;
                        block.assigned_at = new Date();
                    }
                    return block;
                });
                const message = (await resp.json()).message;
                toast.success(message);
            } else {
                const message = (await resp.json()).message;
                toast.error(message);
            }
        } catch (e) {
            toast.error("Errore di rete");
        }
    };

    let searchTerm: string = $state("");
    let blockList = $state(data.blockList);
    let blocks = $derived(
        blockList.filter((block) => block.id.includes(searchTerm))
    );
</script>

<svelte:head>
    <title>Blocchetti</title>
</svelte:head>

<div class="mx-5 mt-5">
    <div class="relative">
        <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
            class="pl-9"
            placeholder="Cerca per codice"
            bind:value={searchTerm}
        />
    </div>
</div>
<div class="m-5">
    <Table.Root>
        <Table.Header>
            <Table.Row>
                <Table.Head class="cursor-pointer select-none"
                    >Codice Primo Biglietto</Table.Head
                >
                <Table.Head class="cursor-pointer select-none"
                    >Assegnato A</Table.Head
                >
                <Table.Head class="cursor-pointer select-none"
                    >Assegnato Da</Table.Head
                >
                <Table.Head class="cursor-pointer select-none"
                    >Data Assegnazione</Table.Head
                >
                <Table.Head class="cursor-pointer select-none text-center"
                    >Assegna/Modifica</Table.Head
                >
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each blocks as block, index}
                <Table.Row>
                    <Table.Cell>
                        <span class="flex items-center gap-4 font-medium">
                            <span class="mr-4">{block.id}</span>
                        </span>
                    </Table.Cell>
                    <Table.Cell>
                        {#if block.assigned_to}
                            <span class="flex items-center gap-2">
                                <Avatar.Root class="h-7 w-7">
                                    <Avatar.Image
                                        src={block.assigned_to?.avatar_url}
                                        alt={block.assigned_to?.alias}
                                    />
                                    <Avatar.Fallback
                                        class="bg-gradient-to-br from-neutral-600 to-neutral-400 text-white font-mono"
                                    >
                                        {block.assigned_to?.alias[0].toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                                {block.assigned_to?.alias}
                            </span>
                        {:else}
                            <span class="flex items-center gap-2">
                                <span>---------</span>
                            </span>
                        {/if}
                    </Table.Cell>
                    <Table.Cell>
                        {#if block.assigned_by}
                            <span class="flex items-center gap-2">
                                <Avatar.Root class="h-7 w-7">
                                    <Avatar.Image
                                        src={block.assigned_by?.avatar_url}
                                        alt={block.assigned_by?.alias}
                                    />
                                    <Avatar.Fallback
                                        class="bg-gradient-to-br from-neutral-600 to-neutral-400 text-white font-mono"
                                    >
                                        {block.assigned_by?.alias[0].toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                                {block.assigned_by?.alias}
                            </span>
                        {:else}
                            <span class="flex items-center gap-2">
                                <span>---------</span>
                            </span>
                        {/if}
                    </Table.Cell>
                    <Table.Cell>
                        <span class="flex items-center gap-2">
                            <Badge
                                class="h-3 min-w-3 rounded-full px-1 font-mono tabular-nums {block.assigned_at
                                    ? 'bg-green-500'
                                    : block.assigned_to
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'}"
                            />
                            {formatDate(block.assigned_at, "Non Assegnato")}
                        </span>
                    </Table.Cell>
                    <Table.Cell>
                        <div
                            class="flex w-full items-center justify-center gap-3"
                        >
                            {#if !block.assigned_to}
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger>
                                        <Button
                                            class="bg-blue-500 px-2 py-1 hover:bg-blue-600"
                                        >
                                            <UserPlus
                                                class="aspect-square w-5 text-black dark:text-white"
                                            />
                                        </Button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content>
                                        {#each data.sellers as seller}
                                            <DropdownMenu.Item
                                                class="flex items-center justify-start gap-2"
                                                onclick={() =>
                                                    addBlock(block.id, seller)}
                                            >
                                                <Avatar.Root class="h-7 w-7">
                                                    <Avatar.Image
                                                        src={seller.avatar_url}
                                                        alt={seller.alias}
                                                    />
                                                    <Avatar.Fallback
                                                        class="bg-gradient-to-br from-neutral-600 to-neutral-400 text-white font-mono"
                                                    >
                                                        {seller.alias[0].toUpperCase()}
                                                    </Avatar.Fallback>
                                                </Avatar.Root>
                                                {seller.alias}
                                            </DropdownMenu.Item>
                                        {/each}
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            {:else}
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger>
                                        <Button
                                            class="bg-yellow-500 px-2 py-1 hover:bg-yellow-600"
                                        >
                                            <UserCog
                                                class="aspect-square w-5 text-black dark:text-white"
                                            />
                                        </Button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content>
                                        {#each data.sellers as seller}
                                            <DropdownMenu.Item
                                                class="flex items-center justify-start gap-2 {seller.id ===
                                                block.assigned_to?.id
                                                    ? 'bg-primary/20 font-semibold text-primary'
                                                    : ''}"
                                                onclick={() =>
                                                    addBlock(block.id, seller)}
                                            >
                                                <Avatar.Root class="h-7 w-7">
                                                    <Avatar.Image
                                                        src={seller.avatar_url}
                                                        alt={seller.alias}
                                                    />
                                                    <Avatar.Fallback
                                                        class="bg-gradient-to-br from-neutral-600 to-neutral-400 text-white font-mono"
                                                    >
                                                        {seller.alias[0].toUpperCase()}
                                                    </Avatar.Fallback>
                                                </Avatar.Root>
                                                {seller.alias}
                                            </DropdownMenu.Item>
                                        {/each}
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                                <Button
                                    class="bg-red-500 px-2 py-1 hover:bg-red-600"
                                    onclick={() => addBlock(block.id, null)}
                                >
                                    <UserMinus
                                        class="aspect-square w-5 text-black dark:text-white"
                                    />
                                </Button>
                            {/if}
                        </div>
                    </Table.Cell>
                </Table.Row>
            {/each}
        </Table.Body>
    </Table.Root>
</div>
