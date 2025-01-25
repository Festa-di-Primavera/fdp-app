<script lang="ts">
    import { Button, Input, Modal, Spinner } from "flowbite-svelte";
    import { CheckCircle2, XCircle } from "lucide-svelte";

    import UsersTable from "$components/UsersTable.svelte";
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import type { User } from "$lib/auth/user";
    import { getStringFromEnumValue } from "$lib/utils/enums";
    import { intToBitArray } from "$lib/utils/permissions";
    import { UserPermissions } from "$models/permissions";
    import { user } from "$store/store.js";

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
    />
    {#if currSelectedUser !== undefined}
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
                <span class="text-sm">UID: {currSelectedUser.id}</span>
                <span class="text-sm">Nome: {currSelectedUser.username}</span>
                <span class="text-sm">E-mail: {currSelectedUser.email}</span>
                <span class="text-sm"
                    >Permessi:
                    {intToBitArray(
                        currSelectedUser.permissions,
                        Object.keys(UserPermissions).length / 2
                    )
                        .filter((item) => item)
                        .map((item, index) =>
                            getStringFromEnumValue(
                                UserPermissions,
                                Math.pow(2, index)
                            )
                        )
                        .join(", ")}
                </span>
                <span class="text-sm">Alias: {currSelectedUser.alias}</span>
            </div>
            <div class="flex flex-col gap-2 mt-4" slot="footer">
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
                <span class="text-sm">UID: {currSelectedUser.id}</span>
                <span class="text-sm">Nome: {currSelectedUser.username}</span>
                <span class="text-sm">E-mail: {currSelectedUser.email}</span>
                <span class="text-sm"
                    >Permessi:
                    {intToBitArray(
                        currSelectedUser.permissions,
                        Object.keys(UserPermissions).length / 2
                    )
                        .filter((item) => item)
                        .map((item, index) =>
                            getStringFromEnumValue(
                                UserPermissions,
                                Math.pow(2, index)
                            )
                        )
                        .join(", ")}
                </span>
                <span class="text-sm">Alias: {currSelectedUser.alias}</span>
            </div>
            <Input bind:value={alias} class="mt-4" />
            <div class="flex flex-col gap-2 mt-4" slot="footer">
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
