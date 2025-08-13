<script lang="ts">
    import type { User } from "$lib/auth/user";
    import * as Avatar from "$lib/components/ui/avatar/index";
    import { Button } from "$lib/components/ui/button/index";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
    import { Input } from "$lib/components/ui/input/index";
    import * as Table from "$lib/components/ui/table/index";
    import * as Tooltip from "$lib/components/ui/tooltip/index";
    import { getStringFromEnumValue } from "$lib/utils/enums";
    import {
        addPermission,
        intToBitArray,
        removePermission,
    } from "$lib/utils/permissions";
    import { capitalizeFirstLetter } from "$lib/utils/textFormat";
    import { UserPermissions } from "$models/permissions";
    import { user } from "$store/store";
    import { Check, ListFilter, SquarePen, Trash2, X } from "@lucide/svelte";
    import { toast } from "svelte-sonner";

    interface Props {
        users: User[];
        currSelectedUser?: User;
        aliasModalOpen: boolean;
        deleteModalOpen: boolean;
        permissionIcons: Record<UserPermissions, typeof Check>;
    }

    let {
        users = $bindable(),
        currSelectedUser = $bindable(),
        aliasModalOpen = $bindable(),
        deleteModalOpen = $bindable(),
        permissionIcons,
    }: Props = $props();

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

            let error = true;
            if (response.ok) {
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
                error = false;
            }

            const message = (await response.json()).message;

            if (error) {
                toast.error(message);
            } else {
                if (add) {
                    toast.success(message);
                } else {
                    toast.warning(message);
                }
            }
        } catch (e) {
            toast.error("Errore di rete");
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
        <div class="flex items-center gap-4">
            <Input
                class="flex-1"
                placeholder={`Cerca per ${filter}`}
                bind:value={searchTerm}
            />
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <Button variant="outline" class="flex items-center gap-2">
                        <ListFilter class="w-4 h-4" />
                        <span>Filtra</span>
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                    <DropdownMenu.Label>Filtra per</DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.RadioGroup bind:value={filter}>
                        <DropdownMenu.RadioItem value="nome">
                            Nome
                        </DropdownMenu.RadioItem>
                        <DropdownMenu.RadioItem value="email">
                            E-Mail
                        </DropdownMenu.RadioItem>
                        <DropdownMenu.RadioItem value="alias">
                            Alias
                        </DropdownMenu.RadioItem>
                    </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
    </div>
    <div class="m-5">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head class="pl-5">Nome</Table.Head>
                    <Table.Head>Email</Table.Head>
                    <Table.Head>Permessi</Table.Head>
                    <Table.Head class="text-center">Alias</Table.Head>
                    <Table.Head class="text-center">Elimina</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each filteredItems || [] as item}
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
                                            class="bg-gradient-to-br from-neutral-600 to-neutral-400 text-white"
                                        >
                                            {item.username[0]?.toUpperCase()}
                                        </Avatar.Fallback>
                                    </Avatar.Root>
                                </div>
                                <span class="max-w-24">{item.username}</span>
                            </span>
                        </Table.Cell>
                        <Table.Cell>
                            <span class="flex items-center gap-2">
                                {#if item.avatar_url}
                                    <Tooltip.Provider delayDuration={300}>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger>
                                                <img
                                                    class="w-5"
                                                    alt="Google"
                                                    src="/google.svg"
                                                />
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>
                                                Google
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    </Tooltip.Provider>
                                {:else}
                                    {@const EmailVerified = item.email_verified
                                        ? Check
                                        : X}
                                    <Tooltip.Provider delayDuration={300}>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger>
                                                <EmailVerified
                                                    tabindex={-1}
                                                    color={item.email_verified
                                                        ? "green"
                                                        : "red"}
                                                    class="w-5"
                                                />
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>
                                                {(item.email_verified
                                                    ? ""
                                                    : "Non ") + "Verificata"}
                                            </Tooltip.Content>
                                        </Tooltip.Root>
                                    </Tooltip.Provider>
                                {/if}
                                {item.email}
                            </span>
                        </Table.Cell>
                        <Table.Cell>
                            <div class="grid w-max min-w-28 grid-cols-5 gap-2">
                                {#each intToBitArray(item.permissions, Object.keys(UserPermissions).length / 2).reverse() as perm, index}
                                    {@const PermissionIcon = getPermissionIcon(
                                        Math.pow(2, index)
                                    )}
                                    <Tooltip.Provider delayDuration={300}>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger>
                                                <button
                                                    onclick={() =>
                                                        handlePermissionChange(
                                                            item,
                                                            Math.pow(2, index),
                                                            !perm
                                                        )}
                                                >
                                                    <PermissionIcon
                                                        class={`w-4 ${perm ? "text-app-accent" : "text-neutral-400 opacity-65"}`}
                                                    />
                                                </button>
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
                                {/each}
                            </div>
                        </Table.Cell>
                        <Table.Cell>
                            <div class="flex gap-2 items-center justify-center">
                                <span class="w-40 truncate">{item.alias}</span>
                                <button onclick={() => triggerAliasModal(item)}>
                                    <SquarePen class="h-5 w-5" />
                                </button>
                            </div>
                        </Table.Cell>
                        <Table.Cell>
                            <div class="grid w-full place-items-center">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onclick={() => {
                                        currSelectedUser = item;
                                        deleteModalOpen = true;
                                    }}
                                >
                                    <Trash2 class="aspect-square w-4" />
                                </Button>
                            </div>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </div>
{/if}
