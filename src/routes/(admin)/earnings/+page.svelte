<script lang="ts">
    import type { User } from "$lib/auth/user";
    import * as Avatar from "$lib/components/ui/avatar/index";
    import { Button } from "$lib/components/ui/button/index";
    import { Input } from "$lib/components/ui/input/index";
    import * as TableCN from "$lib/components/ui/table/index";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: {
            user: User;
            sellers: User[];
        };
    }

    let { data }: Props = $props();

    if (!$user) $user = data.user;

    let sellers: User[] = $state(data.sellers);
    const debtToClaimMap: { [key: string]: number } = $state({});

    const claimMoney = async (selectedUser: User) => {
        const debtToClaim = debtToClaimMap[selectedUser.id];
        if (
            debtToClaim <= 0 ||
            isNaN(debtToClaim) ||
            debtToClaim > selectedUser.owned_money
        ) {
            const message =
                debtToClaim <= 0
                    ? "L'importo deve essere positivo"
                    : debtToClaim > selectedUser.owned_money
                      ? "L'importo è troppo alto"
                      : "Errore";

            toast.error(message);
            return;
        }

        try {
            const resp = await fetch(`/api/money/${selectedUser.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ money: debtToClaim }),
            });

            let error = true;
            if (resp.ok) {
                sellers = sellers.map((item: User) => {
                    if (item.id === selectedUser.id) {
                        item.owned_money -= debtToClaim;
                    }
                    return item;
                });
                sellers = [...sellers];
                error = false;
            }

            const message = (await resp.json()).message;

            if (error) {
                toast.error(message);
            } else {
                toast.success(message);
            }
        } catch (e) {
            toast.error("Errore di rete");
        }
        debtToClaimMap[selectedUser.id] = 0;
    };
</script>

<svelte:head>
    <title>Gestione Denaro</title>
</svelte:head>

<div class="mx-5 mt-5">
    <TableCN.Root>
        <TableCN.Header>
            <TableCN.Row>
                <TableCN.Head class="pl-5">Venditore</TableCN.Head>
                <TableCN.Head class="text-center">Totale Venduto</TableCN.Head>
                <TableCN.Head class="text-center">Da riscuotere</TableCN.Head>
                <TableCN.Head class="text-center">Salda debito</TableCN.Head>
                <TableCN.Head />
            </TableCN.Row>
        </TableCN.Header>
        <TableCN.Body>
            {#each sellers || [] as item, index}
                <TableCN.Row>
                    <TableCN.Cell class="pl-10">
                        <span class="flex items-center font-medium gap-4">
                            <div class="block">
                                <Avatar.Root>
                                    <Avatar.Image
                                        src={item.avatar_url}
                                        alt={item.username[0]}
                                    />
                                    <Avatar.Fallback
                                        class="bg-gradient-to-br from-neutral-600 to-neutral-400 text-white"
                                    >
                                        {item.username[0].toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                            </div>
                            <span class="max-w-24">{item.username}</span>
                        </span>
                    </TableCN.Cell>
                    <TableCN.Cell class="text-center">
                        € {item.total_from_sales}
                    </TableCN.Cell>
                    <TableCN.Cell class="text-center">
                        € {item.owned_money}
                    </TableCN.Cell>
                    <TableCN.Cell>
                        <div
                            class="flex w-full items-center justify-center gap-4"
                        >
                            <Input
                                type="number"
                                min="1"
                                max={item.owned_money}
                                bind:value={debtToClaimMap[item.id]}
                                class="z-10 w-max text-center"
                                disabled={item.owned_money === 0}
                                placeholder="€€€"
                            />
                            <span class="text-nowrap">
                                su € {item.owned_money}
                            </span>
                        </div>
                    </TableCN.Cell>
                    <TableCN.Cell>
                        <Button
                            class="ml-2"
                            onclick={() => claimMoney(item)}
                            disabled={item.owned_money === 0}
                        >
                            Salda
                        </Button>
                    </TableCN.Cell>
                </TableCN.Row>
            {/each}
        </TableCN.Body>
    </TableCN.Root>
</div>

<!-- FLOWBITE OLD VERSION -->
<!-- 
<div class="mx-5 mt-5">
    <Table
        divClass="tableDiv relative overflow-x-auto overflow-y-visible"
        class="relative overflow-visible overflow-x-auto rounded-md shadow-md sm:rounded-lg"
    >
        <TableHead class="dark:bg-neutral-600 dark:text-neutral-300">
            <TableHeadCell class="max-w-5 text-nowrap p-0"></TableHeadCell>
            <TableHeadCell
                class="sticky left-0 h-full cursor-pointer select-none text-nowrap dark:bg-neutral-600 dark:text-neutral-300"
                >Venditore</TableHeadCell
            >
            <TableHeadCell
                class="cursor-pointer select-none text-nowrap text-center"
                >Totale Venduto</TableHeadCell
            >
            <TableHeadCell
                class="cursor-pointer select-none text-nowrap text-center"
                >Da riscuotere</TableHeadCell
            >
            <TableHeadCell
                class="cursor-pointer select-none text-nowrap text-left"
                >Salda debito</TableHeadCell
            >
            <TableHeadCell />
        </TableHead>
        <TableBody class="divide-y">
            {#each sellers || [] as item, index}
                <TableBodyRow
                    class="w-full dark:bg-neutral-700 dark:border-neutral-500"
                >
                    <TableBodyCell class="bg-inherit p-0 pl-5">
                        {#if index < 3}
                            <span
                                class="{index == 0
                                    ? 'text-yellow-400'
                                    : index == 1
                                      ? 'text-gray-400'
                                      : 'text-orange-500'} m-0 p-0 font-mono text-xl"
                                >#{index + 1}</span
                            >
                        {/if}
                    </TableBodyCell>
                    <TableBodyCell>
                        <span
                            class="flex items-center gap-0 overflow-hidden font-medium md:gap-4 md:overflow-visible"
                        >
                            <div class="hidden md:block">
                                {#if item.avatar_url}
                                    <img
                                        loading="lazy"
                                        src={item.avatar_url}
                                        alt={item.username[0]}
                                        class="h-7 w-7 rounded-full object-cover"
                                    />
                                {:else}
                                    <div
                                        class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white"
                                    >
                                        <span
                                            >{item.username[0].toUpperCase()}</span
                                        >
                                    </div>
                                {/if}
                            </div>
                            <span
                                class="max-w-24 overflow-hidden overflow-ellipsis md:max-w-none"
                                >{item.username}</span
                            >
                        </span>
                    </TableBodyCell>
                    <TableBodyCell class="text-center">
                        € {item.total_from_sales}
                    </TableBodyCell>
                    <TableBodyCell class="text-center">
                        € {item.owned_money}
                    </TableBodyCell>
                    <TableBodyCell class="text-center">
                        <div
                            class="flex w-full items-center justify-left gap-4"
                        >
                            <Input
                                type="number"
                                min="1"
                                max={item.owned_money}
                                bind:value={debtToClaimMap[item.id]}
                                class="z-10 w-max text-center dark:bg-neutral-800 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400 dark:disabled:bg-neutral-500 dark:disabled:border-neutral-300"
                                disabled={item.owned_money === 0}
                            />
                            <span class="text-nowrap"
                                >su € {item.owned_money}</span
                            >
                        </div>
                    </TableBodyCell>
                    <TableBodyCell>
                        <Button
                            class="ml-2"
                            onclick={() => claimMoney(item)}
                            disabled={item.owned_money === 0}>Salda</Button
                        >
                    </TableBodyCell>
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>
-->