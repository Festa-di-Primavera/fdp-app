<script lang="ts">
    import type { User } from "$lib/auth/user";
    import { getStringFromEnumValue } from "$lib/utils/enums";
    import {
        addPermission,
        intToBitArray,
        removePermission,
    } from "$lib/utils/permissions";
    import { capitalizeFirstLetter } from "$lib/utils/textFormat";
    import { UserPermissions } from "$models/permissions";
    import { user } from "$store/store";
    import {
        Button,
        Input,
        Popover,
        Radio,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
        Tooltip,
    } from "flowbite-svelte";
    import {
        Check,
        CheckCircle2,
        Filter,
        PenBox,
        Search,
        Trash2,
        X,
        XCircle,
    } from "lucide-svelte";
    import FeedbackToast from "./feedbacks/FeedbackToast.svelte";

    interface Props {
        users: User[];
        currSelectedUser?: User;
        aliasModalOpen: boolean;
        deleteModalOpen: boolean;
        permissionIcons: Record<
            UserPermissions,
            typeof Check
        >;
    }

    let {
        users = $bindable(),
        currSelectedUser = $bindable(),
        aliasModalOpen = $bindable(),
        deleteModalOpen = $bindable(),
        permissionIcons,
    }: Props = $props();

    let color: "green" | "red" = $state("green");
    let feedbackToastMessage: string = $state("");
    let error: boolean = $state(false);
    let feedbackToastOpen: boolean = $state(false);
    let timeOut: NodeJS.Timeout;
    let ToastIcon = $state(XCircle);
    $effect(() => {
        ToastIcon = error ? XCircle : CheckCircle2;
    });

    function getPermissionIcon(permission: UserPermissions) {
        return permissionIcons[permission];
    }

    const handlePermissionChange = async (
        currentUser: User,
        permission: UserPermissions,
        add: boolean
    ) => {
        try {
            const response = await fetch(
                `/api/permissions/${currentUser.id}/${permission}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ add: add }),
                }
            );

            if (response.ok) {
                error = false;
                color = "green";

                users = users.map((item: User) => {
                    if (item.id === currentUser.id) {
                        item.permissions = add
                            ? addPermission(currentUser.permissions, permission)
                            : removePermission(
                                  currentUser.permissions,
                                  permission
                              );
                    }
                    return item;
                });
                if ($user?.id == currentUser.id) {
                    $user.permissions = add
                        ? addPermission($user.permissions, permission)
                        : removePermission($user.permissions, permission);
                }
                users = [...users];
            } else {
                error = true;
                color = "red";
            }

            feedbackToastMessage = (await response.json()).message;
            feedbackToastOpen = true;

            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                feedbackToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);
        } catch (e) {
            error = true;
            color = "red";
            feedbackToastOpen = true;

            clearTimeout(timeOut);
            timeOut = setTimeout(() => {
                feedbackToastOpen = false;
                clearTimeout(timeOut);
            }, 3500);

            feedbackToastMessage = "Errore di rete";
        }
    };

    const triggerAliasModal = async (currentUser: User) => {
        currSelectedUser = currentUser;
        aliasModalOpen = true;
    };

    // search and filter variables
    let searchTerm = $state("");
    let filter = $state("nome");
    let filteredItems: User[] = $state([]);
    $effect(() => {
        filteredItems = users?.filter((item: User) => {
            if (filter === "nome")
                return (
                    item.username
                        .toLowerCase()
                        .indexOf(searchTerm.toLowerCase()) !== -1
                );
            else if (filter === "email")
                return (
                    item.email
                        ?.toLowerCase()
                        .indexOf(searchTerm.toLowerCase()) !== -1
                );
            else if (filter === "alias")
                return (
                    item.alias
                        .toLowerCase()
                        .indexOf(searchTerm.toLowerCase()) !== -1
                );
            else return true;
        });
    });
</script>

{#if $user}
    <div class="mx-5 mt-5">
        <Input placeholder={`Cerca per ${filter}`} bind:value={searchTerm}>
            <Search slot="left" />
            <button slot="right">
                <Filter />
                <Popover
                    placement="bottom-end"
                    class="z-50 p-0"
                    defaultClass="pt-2"
                >
                    Filtra per
                    <ul
                        class="w-48 divide-y divide-gray-200 dark:divide-gray-600"
                    >
                        <li>
                            <Radio class="p-3" bind:group={filter} value="nome"
                                >Nome</Radio
                            >
                        </li>
                        <li>
                            <Radio class="p-3" bind:group={filter} value="email"
                                >E-Mail</Radio
                            >
                        </li>
                        <li>
                            <Radio class="p-3" bind:group={filter} value="alias"
                                >Alias</Radio
                            >
                        </li>
                    </ul>
                </Popover>
            </button>
        </Input>
    </div>
    <div class="mx-5 mt-5">
        <Table
            divClass="tableDiv relative overflow-x-auto overflow-y-visible pb-40"
            class="relative overflow-visible overflow-x-auto rounded-md shadow-md sm:rounded-lg"
        >
            <TableHead>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Nome</div>
                </TableHeadCell>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Email</div>
                </TableHeadCell>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex gap-1">Permessi</div>
                </TableHeadCell>
                <TableHeadCell class="cursor-pointer select-none">
                    <div class="flex justify-center gap-1">Alias</div>
                </TableHeadCell>
                <TableHeadCell class="text-center">Elimina</TableHeadCell>
            </TableHead>
            <TableBody tableBodyClass="divide-y">
                {#each filteredItems || [] as item}
                    <TableBodyRow class="w-full">
                        <TableBodyCell>
                            <span class="flex items-center gap-4 font-medium">
                                {#if item.avatar_url}
                                    <img
                                        loading="lazy"
                                        src={item.avatar_url}
                                        alt={item.username[0]}
                                        class="h-7 w-7 rounded-full"
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
                                <span class="mr-4">{item.username}</span>
                            </span>
                        </TableBodyCell>
                        <TableBodyCell>
                            <span class="flex items-center gap-2">
                                {#if item.avatar_url}
                                    <img
                                        class="w-5"
                                        alt="Google"
                                        src="/google.svg"
                                    />
                                    <Tooltip>Google</Tooltip>
                                {:else}
                                    {@const EmailVerified = item.email_verified
                                        ? Check
                                        : X}
                                    <EmailVerified
                                        color={item.email_verified
                                            ? "green"
                                            : "red"}
                                        class="w-5"
                                    />
                                    <Tooltip
                                        >{(item.email_verified ? "" : "Non ") +
                                            "Verificata"}</Tooltip
                                    >
                                {/if}
                                {item.email}
                            </span>
                        </TableBodyCell>
                        <TableBodyCell>
                            <div class="grid w-max min-w-28 grid-cols-5 gap-2">
                                {#each intToBitArray(item.permissions, Object.keys(UserPermissions).length / 2).reverse() as perm, index}
                                    {@const PermissionIcon = getPermissionIcon(
                                        Math.pow(2, index)
                                    )}
                                    <button
                                        onclick={() =>
                                            handlePermissionChange(
                                                item,
                                                Math.pow(2, index),
                                                !perm
                                            )}
                                    >
                                        <PermissionIcon
                                            class={`w-4 ${perm ? "text-primary-300" : "text-slate-500"}`}
                                        />
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
                                    </button>
                                {/each}
                            </div>
                        </TableBodyCell>
                        <TableBodyCell>
                            <div
                                class="flex w-full items-center justify-between gap-3"
                            >
                                {item.alias}
                                <button onclick={() => triggerAliasModal(item)}>
                                    <PenBox class="h-5 w-5" />
                                </button>
                            </div>
                        </TableBodyCell>
                        <TableBodyCell>
                            <div class="grid w-full place-items-center">
                                <Button
                                    class="bg-red-500 px-2 py-1 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600"
                                    on:click={() => {
                                        currSelectedUser = item;
                                        deleteModalOpen = true;
                                    }}
                                >
                                    <Trash2
                                        class="aspect-square w-4 text-gray-900 dark:text-white"
                                    />
                                </Button>
                            </div>
                        </TableBodyCell>
                    </TableBodyRow>
                {/each}
            </TableBody>
        </Table>
    </div>
{/if}

<FeedbackToast
    bind:open={feedbackToastOpen}
    bind:color
    bind:message={feedbackToastMessage}
    bind:ToastIcon
/>
