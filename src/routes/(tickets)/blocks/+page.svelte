<script lang="ts">
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import { formatDate } from "$lib/utils/textFormat";
    import { type Block } from "$lib/utils/tickets";
    import { user } from "$store/store";
    import {
        Button,
        Dropdown,
        DropdownItem,
        Indicator,
        Input,
        Spinner,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
    } from "flowbite-svelte";
    import {
        CheckCircle2,
        Search,
        UserCog,
        UserMinus,
        UserPlus,
        XCircle,
    } from "lucide-svelte";

    interface Props {
        data: { user: User; sellers: User[]; blockList: Block[] };
    }

    let { data }: Props = $props();
    if (!$user) $user = data.user;

    let error: boolean = $state(false);
    let color: "green" | "red" = $state("green");
    let message: string = $state("");
    let changeToastOpen: boolean = $state(false);
    let timeOut: NodeJS.Timeout;
    let ToastIcon = $state(CheckCircle2);
    $effect(() => {
        ToastIcon = error ? XCircle : CheckCircle2;
    });

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
                error = false;
                color = "green";
                blocks = blocks.map((block) => {
                    if (block.id === ticketCode) {
                        block.assigned_to = seller;
                        block.assigned_by = $user;
                        block.assigned_at = new Date();
                    }
                    return block;
                });
            } else {
                error = true;
                color = "red";
            }

            message = (await resp.json()).message;
            changeToastOpen = true;

            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                changeToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);
        } catch (e) {
            error = true;
            color = "red";
            changeToastOpen = true;
            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                changeToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);
            message = "Errore di rete";
        }
    };

    let searchTerm: string = $state("");
    let blocks = $derived(
        data.blockList.filter((block) => block.id.includes(searchTerm))
    );
</script>

<svelte:head>
    <title>Blocchetti</title>
</svelte:head>

{#if $user}
    <div class="mx-5 mt-5">
        <Input
            class="dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
            placeholder="Cerca per codice"
            bind:value={searchTerm}
        >
            <Search slot="left" />
        </Input>
    </div>
    <div class="m-5">
        <Table
            divClass="tableDiv relative overflow-visible"
            class="relative overflow-x-visible overflow-y-auto rounded-md shadow-md sm:rounded-lg"
        >
            <TableHead class="dark:bg-neutral-600 dark:text-neutral-300">
                <TableHeadCell class="cursor-pointer select-none"
                    >Codice Primo Biglietto</TableHeadCell
                >
                <TableHeadCell class="cursor-pointer select-none"
                    >Assegnato A</TableHeadCell
                >
                <TableHeadCell class="cursor-pointer select-none"
                    >Assegnato Da</TableHeadCell
                >
                <TableHeadCell class="cursor-pointer select-none"
                    >Data Assegnazione</TableHeadCell
                >
                <TableHeadCell class="cursor-pointer select-none text-center"
                    >Assegna/Modifica</TableHeadCell
                >
            </TableHead>
            <TableBody tableBodyClass="divide-y">
                {#each blocks as block, index}
                    <TableBodyRow
                        class="w-full dark:bg-neutral-700 dark:border-neutral-500"
                    >
                        <TableBodyCell>
                            <span class="flex items-center gap-4 font-medium">
                                <span class="mr-4">{block.id}</span>
                            </span>
                        </TableBodyCell>
                        <TableBodyCell>
                            {#if block.assigned_to}
                                <span class="flex items-center gap-2">
                                    {#if block.assigned_to?.avatar_url}
                                        <img
                                            loading="lazy"
                                            src={block.assigned_to.avatar_url}
                                            alt={block.assigned_to.alias[0]}
                                            class="h-7 w-7 rounded-full"
                                        />
                                    {:else}
                                        <div
                                            class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white"
                                        >
                                            <span
                                                >{block.assigned_to?.alias[0].toUpperCase()}</span
                                            >
                                        </div>
                                    {/if}
                                    {block.assigned_to?.alias}
                                </span>
                            {:else}
                                <span class="flex items-center gap-2">
                                    <span>---------</span>
                                </span>
                            {/if}
                        </TableBodyCell>
                        <TableBodyCell>
                            {#if block.assigned_by}
                                <span class="flex items-center gap-2">
                                    {#if block.assigned_by?.avatar_url}
                                        <img
                                            loading="lazy"
                                            src={block.assigned_by?.avatar_url}
                                            alt={block.assigned_by?.alias[0]}
                                            class="h-7 w-7 rounded-full"
                                        />
                                    {:else}
                                        <div
                                            class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white"
                                        >
                                            <span
                                                >{block.assigned_by?.alias[0].toUpperCase()}</span
                                            >
                                        </div>
                                    {/if}
                                    {block.assigned_by?.alias}
                                </span>
                            {:else}
                                <span class="flex items-center gap-2">
                                    <span>---------</span>
                                </span>
                            {/if}
                        </TableBodyCell>
                        <TableBodyCell>
                            <span class="flex items-center gap-2">
                                <Indicator
                                    color={block.assigned_to
                                        ? "green"
                                        : block.assigned_at
                                          ? "yellow"
                                          : "red"}
                                />
                                {formatDate(block.assigned_at, "Non Assegnato")}
                            </span>
                        </TableBodyCell>
                        <TableBodyCell>
                            <div
                                class="flex w-full items-center justify-center gap-3"
                            >
                                {#if !block.assigned_to}
                                    <Button
                                        id="assign-{index}"
                                        color="blue"
                                        class="bg-blue-500 px-2 py-1 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        <UserPlus
                                            class="aspect-square w-5 text-gray-900 dark:text-white"
                                        />
                                    </Button>
                                    <Dropdown
                                        placement="bottom-end"
                                        border
                                        classContainer="dark:bg-neutral-800 dark:border-neutral-600"
                                        triggeredBy="#assign-{index}"
                                    >
                                        {#each data.sellers as seller}
                                            <DropdownItem
                                                class="flex items-center justify-start gap-2 dark:hover:bg-neutral-700"
                                                on:click={() =>
                                                    addBlock(block.id, seller)}
                                            >
                                                {#if seller.avatar_url}
                                                    <img
                                                        loading="lazy"
                                                        src={seller.avatar_url}
                                                        alt={seller.alias[0]}
                                                        class="h-7 w-7 rounded-full"
                                                    />
                                                {:else}
                                                    <div
                                                        class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white"
                                                    >
                                                        <span
                                                            >{seller.alias[0].toUpperCase()}</span
                                                        >
                                                    </div>
                                                {/if}
                                                {seller.alias}
                                            </DropdownItem>
                                        {/each}
                                    </Dropdown>
                                {:else}
                                    <Button
                                        id="edit-assign-{index}"
                                        color="yellow"
                                        class="bg-yellow-500 px-2 py-1 hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                                    >
                                        <UserCog
                                            class="aspect-square w-5 text-gray-900 dark:text-white"
                                        />
                                    </Button>
                                    <Dropdown
                                        placement="bottom-end"
                                        border
                                        triggeredBy="#edit-assign-{index}"
                                        classContainer="dark:bg-neutral-800 dark:border-neutral-600"
                                    >
                                        {#each data.sellers as seller}
                                            <DropdownItem
                                                class="flex items-center justify-start gap-2 {seller.id ===
                                                block.assigned_to.id
                                                    ? 'text-primary-400'
                                                    : ''}"
                                                on:click={() =>
                                                    addBlock(block.id, seller)}
                                            >
                                                {#if seller.avatar_url}
                                                    <img
                                                        loading="lazy"
                                                        src={seller.avatar_url}
                                                        alt={seller.alias[0]}
                                                        class="h-7 w-7 rounded-full"
                                                    />
                                                {:else}
                                                    <div
                                                        class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white"
                                                    >
                                                        <span
                                                            >{seller.alias[0].toUpperCase()}</span
                                                        >
                                                    </div>
                                                {/if}
                                                {seller.alias}
                                            </DropdownItem>
                                        {/each}
                                    </Dropdown>
                                    <Button
                                        color="red"
                                        class="bg-red-500 px-2 py-1 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600"
                                        on:click={() =>
                                            addBlock(block.id, null)}
                                    >
                                        <UserMinus
                                            class="aspect-square w-5 text-gray-900 dark:text-white"
                                        />
                                    </Button>
                                {/if}
                            </div>
                        </TableBodyCell>
                    </TableBodyRow>
                {/each}
            </TableBody>
        </Table>
    </div>
{:else}
    <div
        class="mt-10 flex w-full flex-grow flex-col items-center justify-center gap-5"
    >
        <Spinner size="sm" class="max-w-12 self-center" />
        <span class="text-2xl font-semibold text-primary-600">Attendere...</span
        >
    </div>
{/if}

<FeedbackToast
    bind:open={changeToastOpen}
    bind:color
    bind:ToastIcon
    bind:message
/>
