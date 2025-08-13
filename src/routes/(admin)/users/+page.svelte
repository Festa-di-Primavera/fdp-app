<script lang="ts">
    import {
        ChefHat,
        Coins,
        Dna,
        DollarSign,
        Info,
        LayoutDashboard,
        ScanLine,
        Ticket,
        Users,
        Utensils,
    } from "@lucide/svelte";

    import UsersTable from "$components/UsersTable.svelte";
    import type { User } from "$lib/auth/user";
    import { Button } from "$lib/components/ui/button/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as Tooltip from "$lib/components/ui/tooltip/index";
    import { getStringFromEnumValue } from "$lib/utils/enums";
    import { intToBitArray } from "$lib/utils/permissions";
    import { capitalizeFirstLetter } from "$lib/utils/textFormat";
    import { UserPermissions } from "$models/permissions";
    import { user } from "$store/store.js";
    import { toast } from "svelte-sonner";

    interface Props {
        data: {
            user: User;
            usersList: User[];
        };
    }

    let { data }: Props = $props();
    if (!$user) $user = data.user;

    // fetch all users
    let users = $state(data.usersList);

    // modal state variable
    let deleteModalOpen: boolean = $state(false);

    // association between userpermissions and their respective icons
    const permissionIcons = {
        [UserPermissions.INFO_BIGLIETTO]: Info,
        [UserPermissions.VENDITA]: DollarSign,
        [UserPermissions.CHECK_IN]: ScanLine,
        [UserPermissions.CUCINA]: ChefHat,
        [UserPermissions.CASSA]: Coins,
        [UserPermissions.DASHBOARD]: LayoutDashboard,
        [UserPermissions.LISTA_BIGLIETTI]: Ticket,
        [UserPermissions.UTENTI]: Users,
        [UserPermissions.GENERAZIONE]: Dna,
        [UserPermissions.ORDINI]: Utensils,
    };

    function getPermissionIcon(permission: UserPermissions) {
        return permissionIcons[permission];
    }

    // function to handle user delete
    const handleUserDelete = async (user?: User) => {
        if (!user) return;

        try {
            let res = await fetch(`/api/users/${user.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            let error = true;
            if (res.ok) {
                error = false;
                users = users.filter((item: User) => item.id !== user.id);
            } else if (res.status === 404) {
                users = users.filter((item: User) => item.id !== user.id);
            }

            const message = (await res.json()).message;
            if (error) {
                toast.error(message);
            } else {
                toast.success(message);
            }
        } catch (e) {
            toast.error("Errore di rete");
        }
    };

    // alias modal state variables
    let aliasModalOpen: boolean = $state(false);
    let alias: string = $state("");

    // current selected user state variable
    let currSelectedUser: User | undefined = $state();

    const handleAliasChange = async (user?: User) => {
        if (!user) return;

        if (alias !== null && alias != "" && alias != user.alias) {
            const res = await fetch(`/api/alias/${user.id}/${alias}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            let error = true;
            if (res.ok) {
                users = users.map((item: User) => {
                    if (item.id === user.id) {
                        item.alias = alias;
                    }
                    return item;
                });
                error = false;
            }

            if (res.status === 404) {
                users = users.filter((item: User) => item.id !== user.id);
            }

            const message = (await res.json()).message;
            if (error) {
                toast.error(message);
            } else {
                toast.success(message);
            }
        }

        aliasModalOpen = false;
        alias = "";
    };
</script>

<svelte:head>
    <title>Utenti</title>
</svelte:head>

<UsersTable
    bind:users
    bind:currSelectedUser
    bind:aliasModalOpen
    bind:deleteModalOpen
    {permissionIcons}
/>
{#if currSelectedUser !== undefined}
    {#snippet UserInfo(currSelectedUser: User)}
        <span class="text-sm">UID: {currSelectedUser.id}</span>
        <span class="text-sm">Nome: {currSelectedUser.username}</span>
        <span class="text-sm">E-mail: {currSelectedUser.email}</span>
        <span class="text-sm flex gap-4 items-center"
            >Permessi:
            <div class="flex gap-2">
                {#each intToBitArray(currSelectedUser.permissions, Object.keys(UserPermissions).length / 2)
                    .reverse()
                    .map((perm, index) => ({ perm, index }))
                    .filter(({ perm }) => perm) as { index }}
                    {@const PermissionIcon = getPermissionIcon(
                        Math.pow(2, index)
                    )}

                    <div class="flex items-center gap-1">
                        <Tooltip.Provider delayDuration={300}>
                            <Tooltip.Root>
                                <Tooltip.Trigger>
                                    <PermissionIcon
                                        class="w-4 text-app-accent"
                                    />
                                </Tooltip.Trigger>
                                <Tooltip.Content>
                                    {capitalizeFirstLetter(
                                        getStringFromEnumValue(
                                            UserPermissions,
                                            Math.pow(2, index)
                                        )
                                            .toLowerCase()
                                            .replace("_", " ")
                                    )}
                                </Tooltip.Content>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    </div>
                {/each}
            </div>
        </span>
        <span class="text-sm">Alias: {currSelectedUser.alias}</span>
    {/snippet}

    <Dialog.Root bind:open={deleteModalOpen}>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title>Elimina {currSelectedUser.username}</Dialog.Title>
            </Dialog.Header>
            <span class="text-md"
                >Vuoi eliminare l'utente <b>{currSelectedUser.username}</b
                >?</span
            >
            <div class="flex flex-col gap-2">
                {@render UserInfo(currSelectedUser)}
            </div>
            <Dialog.Footer>
                <Button
                    variant="destructive"
                    onclick={() => {
                        handleUserDelete(currSelectedUser);
                        deleteModalOpen = false;
                    }}
                >
                    Elimina
                </Button>
                <Button
                    variant="outline"
                    onclick={() => (deleteModalOpen = false)}>Annulla</Button
                >
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
    <Dialog.Root bind:open={aliasModalOpen}>
        <Dialog.Content>
            <Dialog.Header>
                <Dialog.Title
                    >Aggiorna l'alias di {currSelectedUser.username}</Dialog.Title
                >
            </Dialog.Header>
            <span class="text-md"
                >Vuoi aggiornare l'alias di <b>{currSelectedUser.username}</b
                >?</span
            >
            <div class="flex flex-col gap-2">
                {@render UserInfo(currSelectedUser)}
            </div>

            <Label class="mt-4">
                Nuovo alias
                <Input bind:value={alias} class="mt-2" />
            </Label>
            <Dialog.Footer>
                <Button onclick={() => handleAliasChange(currSelectedUser)}
                    >Aggiorna</Button
                >
                <Button
                    variant="outline"
                    onclick={() => {
                        alias = "";
                        aliasModalOpen = false;
                    }}
                >
                    Annulla
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
{/if}
