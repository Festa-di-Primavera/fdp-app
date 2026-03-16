<script lang="ts">
    import type { User } from "$lib/auth/user";
    import * as Avatar from "$lib/components/ui/avatar/index";
    import { Button } from "$lib/components/ui/button/index";
    import { Input } from "$lib/components/ui/input/index";
    import * as Table from "$lib/components/ui/table/index";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: {
            user: User;
            sellers: User[];
        };
    }

    let { data }: Props = $props();

    $effect(() => {
        if (!$user) $user = data.user;
    });

    let sellers: User[] = $derived(data.sellers);
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
    <Table.Root>
        <Table.Header>
            <Table.Row>
                <Table.Head class="pl-5">Venditore</Table.Head>
                <Table.Head class="text-center">Totale Venduto</Table.Head>
                <Table.Head class="text-center">Da riscuotere</Table.Head>
                <Table.Head class="text-center">Salda debito</Table.Head>
                <Table.Head />
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each sellers || [] as item, index}
                <Table.Row>
                    <Table.Cell class="pl-10">
                        <span class="flex items-center font-medium gap-4">
                            <div class="block">
                                <Avatar.Root>
                                    <Avatar.Image
                                        src={item.avatar_url}
                                        alt={item.username[0]}
                                    />
                                    <Avatar.Fallback
                                        class="bg-neutral-700 border-2 border-neutral-600 text-white"
                                    >
                                        {item.username[0].toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar.Root>
                            </div>
                            <span class="max-w-24">{item.username}</span>
                        </span>
                    </Table.Cell>
                    <Table.Cell class="text-center">
                        € {item.total_from_sales}
                    </Table.Cell>
                    <Table.Cell class="text-center">
                        € {item.owned_money}
                    </Table.Cell>
                    <Table.Cell>
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
                    </Table.Cell>
                    <Table.Cell>
                        <Button
                            class="ml-2"
                            onclick={() => claimMoney(item)}
                            disabled={item.owned_money === 0}
                        >
                            Salda
                        </Button>
                    </Table.Cell>
                </Table.Row>
            {/each}
        </Table.Body>
    </Table.Root>
</div>
