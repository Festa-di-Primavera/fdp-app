<script lang="ts">
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import { user } from "$store/store";
    import {
        Button,
        Input,
        Spinner,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
    } from "flowbite-svelte";
    import { CheckCircle2, XCircle } from "lucide-svelte";

    interface Props {
        data: {
            user: User;
            sellers: User[];
        };
    }

    let { data }: Props = $props();

    if (!$user) $user = data.user;

    // changes toast variables
    let changeToastOpen: boolean = $state(false);
    let color: "green" | "red" = $state("green");
    let message: string = $state("");
    let error: boolean = $state(false);
    let timeOut: NodeJS.Timeout;
    const ToastIcon = $derived(error ? XCircle : CheckCircle2);

    let sellers: User[] = $state(data.sellers);
    const debtToClaimMap: { [key: string]: number } = $state({});

    const claimMoney = async (selectedUser: User) => {
        const debtToClaim = debtToClaimMap[selectedUser.id];
        if (
            debtToClaim <= 0 ||
            isNaN(debtToClaim) ||
            debtToClaim > selectedUser.owned_money
        ) {
            error = true;
            color = "red";
            changeToastOpen = true;
            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                changeToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);
            message =
                debtToClaim <= 0
                    ? "L'importo deve essere positivo"
                    : debtToClaim > selectedUser.owned_money
                      ? "L'importo è troppo alto"
                      : "Errore";
            return;
        }

        try {
            const resp = await fetch(`/api/money/${selectedUser.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ money: debtToClaim }),
            });

            if (resp.ok) {
                sellers = sellers.map((item: User) => {
                    if (item.id === selectedUser.id) {
                        item.owned_money -= debtToClaim;
                    }
                    return item;
                });
                sellers = [...sellers];
                error = false;
                color = "green";
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
        debtToClaimMap[selectedUser.id] = 0;
    };
</script>

<svelte:head>
    <title>Gestione Denaro</title>
</svelte:head>

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
                            <!-- Classifica -->
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

<FeedbackToast bind:open={changeToastOpen} {color} {ToastIcon} {message} />
