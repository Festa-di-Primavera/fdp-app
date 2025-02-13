<script lang="ts">
    import { Button, Input, Label, Modal, Spinner, Tooltip } from "flowbite-svelte";
    import {
        CheckCircle2,
        XCircle,
        Ticket,
        ScanLine,
        Info,
        LayoutDashboard,
        ChefHat,
        Coins,
        Dna,
        DollarSign,
        Users,
    } from "lucide-svelte";

    import UsersTable from "$components/UsersTable.svelte";
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import { getStringFromEnumValue } from "$lib/utils/enums";
    import { intToBitArray } from "$lib/utils/permissions";
    import { UserPermissions } from "$models/permissions";
    import { user } from "$store/store.js";
    import { capitalizeFirstLetter } from "$lib/utils/textFormat";

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

    // changes toast variables
    let changeToastOpen: boolean = $state(false);
    let color: "green" | "red" = $state("green");
    let message: string = $state("");
    let error: boolean = $state(false);
    let timeOut: NodeJS.Timeout;
    let toastIcon = $derived(error ? XCircle : CheckCircle2);

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

            if (res.ok) {
                error = false;
                color = "green";
                users = users.filter((item: User) => item.id !== user.id);
            } else if (res.status === 404) {
                error = true;
                color = "red";
                users = users.filter((item: User) => item.id !== user.id);
            } else {
                error = true;
                color = "red";
            }

            message = (await res.json()).message;
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

            if (res.ok) {
                color = "green";
                error = false;
                users = users.map((item: User) => {
                    if (item.id === user.id) {
                        item.alias = alias;
                    }
                    return item;
                });
            } else {
                color = "red";
                error = true;
            }

            if (res.status === 404) {
                users = users.filter((item: User) => item.id !== user.id);
            }

            changeToastOpen = true;
            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                changeToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);
            message = (await res.json()).message;
        }

        aliasModalOpen = false;
        alias = "";
    };
</script>

<svelte:head>
    <title>Utenti</title>
</svelte:head>

{#if $user}
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
                            <Tooltip color="primary" border>
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
            class="z-50"
        >
            <span class="text-md"
                >Vuoi eliminare l'utente <b>{currSelectedUser.username}</b
                >?</span
            >
            <div class="flex flex-col gap-2">
                {@render UserInfo(currSelectedUser)}
            </div>
            <div class="flex gap-2 mt-4" slot="footer">
                <Button
                    class="bg-red-500 dark:bg-red-500"
                    on:click={() => {
                        handleUserDelete(currSelectedUser);
                        deleteModalOpen = false;
                    }}
                >
                    Elimina
                </Button>
                <Button
                    color="alternative"
                    on:click={() => (deleteModalOpen = false)}>Annulla</Button
                >
            </div>
        </Modal>
        <Modal
            bind:open={aliasModalOpen}
            title={`Aggiorna l'alias di ${currSelectedUser.username}`}
            class="z-50"
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
                <Input bind:value={alias} class="mt-2" />
            </Label>
            <div class="flex gap-2 mt-4" slot="footer">
                <Button on:click={() => handleAliasChange(currSelectedUser)}
                    >Aggiorna</Button
                >
                <Button
                    color="alternative"
                    on:click={() => {
                        alias = "";
                        aliasModalOpen = false;
                    }}
                >
                    Annulla
                </Button>
            </div>
        </Modal>
    {/if}
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
    ToastIcon={toastIcon}
    bind:message
/>
