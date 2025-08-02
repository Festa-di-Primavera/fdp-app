<script lang="ts">
    import { Button, Input, Label, Modal, Tooltip } from "flowbite-svelte";
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
                        <PermissionIcon class="w-4 text-primary-300" />
                        <Tooltip
                            color="gray"
                            class="dark:bg-neutral-800 dark:border-neutral-500"
                        >
                            {capitalizeFirstLetter(
                                getStringFromEnumValue(
                                    UserPermissions,
                                    Math.pow(2, index)
                                )
                                    .toLowerCase()
                                    .replace("_", " ")
                            )}
                        </Tooltip>
                    </div>
                {/each}
            </div>
        </span>
        <span class="text-sm">Alias: {currSelectedUser.alias}</span>
    {/snippet}

    <Modal
        title={`Elimina ${currSelectedUser.username}`}
        bind:open={deleteModalOpen}
        class="z-50 dark:bg-neutral-800 dark:divide-neutral-500 dark:text-neutral-300"
        headerClass="dark:bg-neutral-800 dark:text-neutral-300"
        footerClass="dark:bg-neutral-800 dark:text-neutral-300"
    >
        <span class="text-md"
            >Vuoi eliminare l'utente <b>{currSelectedUser.username}</b>?</span
        >
        <div class="flex flex-col gap-2">
            {@render UserInfo(currSelectedUser)}
        </div>
        {#snippet footer()}
            <div class="flex gap-2 mt-4">
                <Button
                    class="bg-red-500 dark:bg-red-500"
                    onclick={() => {
                        handleUserDelete(currSelectedUser);
                        deleteModalOpen = false;
                    }}
                >
                    Elimina
                </Button>
                <Button
                    color="alternative"
                    class="dark:text-neutral-400 dark:border-neutral-400 dark:hover:bg-neutral-700 dark:hover:border-neutral-300"
                    onclick={() => (deleteModalOpen = false)}>Annulla</Button
                >
            </div>
        {/snippet}
    </Modal>
    <Modal
        bind:open={aliasModalOpen}
        title={`Aggiorna l'alias di ${currSelectedUser.username}`}
        class="z-50 dark:bg-neutral-800 dark:divide-neutral-500 dark:text-neutral-300"
        headerClass="dark:bg-neutral-800 dark:text-neutral-300"
        footerClass="dark:bg-neutral-800 dark:text-neutral-300"
    >
        <span class="text-md"
            >Vuoi aggiornare l'alias di <b>{currSelectedUser.username}</b
            >?</span
        >
        <div class="flex flex-col gap-2">
            {@render UserInfo(currSelectedUser)}
        </div>

        <Label class="mt-4">
            Nuovo alias
            <Input
                bind:value={alias}
                class="mt-2 dark:bg-neutral-700 dark:border-neutral-500 dark:text-neutral-300 dark:placeholder-neutral-400"
            />
        </Label>
        {#snippet footer()}
            <div class="flex gap-2 mt-4">
                <Button onclick={() => handleAliasChange(currSelectedUser)}
                    >Aggiorna</Button
                >
                <Button
                    color="alternative"
                    class="dark:text-neutral-400 dark:border-neutral-400 dark:hover:bg-neutral-700 dark:hover:border-neutral-300"
                    onclick={() => {
                        alias = "";
                        aliasModalOpen = false;
                    }}
                >
                    Annulla
                </Button>
            </div>
        {/snippet}
    </Modal>
{/if}
