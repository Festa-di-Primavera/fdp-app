<script lang="ts">
    import * as Accordion from "$lib/components/ui/accordion/index";
    import * as Avatar from "$lib/components/ui/avatar/index";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card/index";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import * as Drawer from "$lib/components/ui/drawer/index";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";

    import {
        TextAlignJustify,
        ChefHat,
        CloudUpload,
        CoinsIcon,
        Dna,
        DollarSign,
        HandPlatter,
        House,
        Info,
        Key,
        LayoutDashboard,
        LogOut,
        NotepadText,
        ScanLine,
        ScanQrCode,
        ScrollText,
        Ticket,
        Trash,
        UserCog,
        Users,
        UtensilsCrossed,
        View,
        X,
    } from "@lucide/svelte";
    import Logo from "./Logo.svelte";

    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import { hasAnyPermissions } from "$lib/utils/permissions";
    import { UserPermissions } from "$models/permissions";
    import { user } from "$store/store";
    import DarkMode from "./DarkMode.svelte";

    interface Route {
        label: string;
        slug?: string;
        permission?: number | number[];
        icon: any;
        children?: Route[];
    }

    $effect(() => {
        if (page.url.pathname == "/login") {
            hidden = true;
        }
    });

    const routes: Route[] = [
        {
            label: "Home",
            slug: "/",
            icon: House,
        },
        {
            label: "Gestione Utenti",
            icon: UserCog,
            permission: UserPermissions.UTENTI,
            children: [
                {
                    label: "Utenti",
                    slug: "/users",
                    icon: Users,
                },
                {
                    label: "Blocchetti",
                    slug: "/blocks",
                    icon: NotepadText,
                },
                {
                    label: "Incassi",
                    slug: "/earnings",
                    icon: DollarSign,
                },
            ],
        },
        {
            label: "Biglietti",
            icon: Ticket,
            permission: [
                UserPermissions.DASHBOARD,
                UserPermissions.LISTA_BIGLIETTI,
                UserPermissions.GENERAZIONE,
            ],
            children: [
                {
                    label: "Dashboard",
                    slug: "/dashboard",
                    permission: UserPermissions.DASHBOARD,
                    icon: LayoutDashboard,
                },
                {
                    label: "Lista Biglietti",
                    slug: "/tickets",
                    permission: UserPermissions.LISTA_BIGLIETTI,
                    icon: ScrollText,
                },
                {
                    label: "Genera biglietti",
                    slug: "/generate",
                    permission: UserPermissions.GENERAZIONE,
                    icon: Dna,
                },
            ],
        },
        {
            label: "Vendi",
            slug: "/sell",
            permission: UserPermissions.VENDITA,
            icon: DollarSign,
        },
        {
            label: "Check-in",
            slug: "/check-in",
            permission: UserPermissions.CHECK_IN,
            icon: ScanLine,
        },
        {
            label: "Info biglietto",
            slug: "/ticket-info",
            permission: UserPermissions.INFO_BIGLIETTO,
            icon: Info,
        },
        {
            label: "Cassa",
            slug: "/cashier",
            permission: UserPermissions.CASSA,
            icon: CoinsIcon,
        },
        {
            label: "Checkpoint",
            slug: "/checkpoint",
            permission: UserPermissions.ORDINI,
            icon: ScanQrCode,
        },
        {
            label: "Cucina",
            slug: "/kitchen",
            permission: UserPermissions.CUCINA,
            icon: ChefHat,
        },
        {
            label: "Ordini",
            icon: UtensilsCrossed,
            permission: [
                UserPermissions.ORDINI,
                UserPermissions.CASSA,
                UserPermissions.CUCINA,
            ],
            children: [
                {
                    label: "Ordini Staff",
                    slug: "/staff-orders",
                    permission: UserPermissions.ORDINI,
                    icon: HandPlatter,
                },
                {
                    label: "Vedi Ordini",
                    slug: "/orders-view",
                    permission: UserPermissions.ORDINI,
                    icon: View,
                },
            ],
        },
    ];

    function filterRoutes(routes: Route[]): Route[] {
        return routes.filter((route) => {
            if (!hasAnyPermissions($user?.permissions, route.permission)) {
                return false;
            }

            if (route.children) {
                route.children = route.children.filter((child) =>
                    hasAnyPermissions($user?.permissions, child.permission)
                );
                return route.children.length > 0;
            }

            return true;
        });
    }

    let hidden: boolean = $state(true);
    let drawerOpen: boolean = $state(false);

    let deleteModalOpen: boolean = $state(false);
</script>

<navbar
    class="sticky top-0 z-40 w-full h-max flex items-center justify-between bg-primary-foreground border-b border-border"
>
    <a class="my-1 ml-[1%]" href="/">
        <Logo />
    </a>
    <div class="mr-5 flex items-center justify-end gap-5">
        <DarkMode />

        {#if $user}
            <Drawer.Root direction="right" bind:open={drawerOpen}>
                <Drawer.Trigger>
                    <div
                        class={buttonVariants({
                            variant: "outline",
                            size: "icon",
                        })}
                    >
                        <TextAlignJustify />
                    </div>
                </Drawer.Trigger>

                <Drawer.Content>
                    <div
                        class="mx-auto w-full max-w-sm h-screen flex flex-col justify-between"
                    >
                        <div class="flex flex-col overflow-y-hidden">
                            <Drawer.Header class="relative">
                                <Drawer.Title>Menu</Drawer.Title>
                                <Drawer.Close class="absolute top-4 right-5">
                                    <X class="cursor-pointer" />
                                </Drawer.Close>
                            </Drawer.Header>
                            <div
                                class="flex gap-4 flex-col overflow-y-auto py-2 px-4"
                            >
                                {#each filterRoutes(routes) as route}
                                    {#if route.children}
                                        <Accordion.Root
                                            type="single"
                                            class="w-full"
                                            value={route.children.reduce(
                                                (acc, child) =>
                                                    acc ||
                                                    child.slug ===
                                                        page.url.pathname,
                                                false
                                            )
                                                ? route.label
                                                : ""}
                                        >
                                            <Accordion.Item value={route.label}>
                                                <Accordion.Trigger class="py-0">
                                                    <span
                                                        class="mr-4 flex w-max items-center gap-4 text-xl font-normal"
                                                    >
                                                        <route.icon />
                                                        {route.label}
                                                    </span>
                                                </Accordion.Trigger>
                                                <Accordion.Content class="pb-0">
                                                    <div class="mt-2 pl-5">
                                                        {#each route.children as childRoute}
                                                            <a
                                                                onclick={() =>
                                                                    (drawerOpen = false)}
                                                                href={childRoute.slug}
                                                            >
                                                                <span
                                                                    class="flex w-full items-center gap-4 py-2 text-xl {page
                                                                        .url
                                                                        .pathname ===
                                                                    childRoute.slug
                                                                        ? 'font-semibold text-app-accent'
                                                                        : 'font-normal'}"
                                                                >
                                                                    <childRoute.icon
                                                                    />
                                                                    {childRoute.label}
                                                                </span>
                                                            </a>
                                                        {/each}
                                                    </div>
                                                </Accordion.Content>
                                            </Accordion.Item>
                                        </Accordion.Root>
                                    {:else}
                                        <a
                                            onclick={() => (drawerOpen = false)}
                                            href={route.slug}
                                        >
                                            <span
                                                class="flex w-full items-center gap-4 text-xl {page
                                                    .url.pathname === route.slug
                                                    ? 'font-semibold text-app-accent'
                                                    : 'font-normal'}"
                                            >
                                                <route.icon />
                                                {route.label}
                                            </span>
                                        </a>
                                    {/if}
                                {/each}
                            </div>
                        </div>
                        {#if $user !== null}
                            <Card.Root class="m-5 bottom-0 py-4">
                                <Card.Content
                                    class="flex justify-between items-center px-3"
                                >
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger
                                            class="flex items-center gap-3"
                                        >
                                            <Avatar.Root>
                                                <Avatar.Image
                                                    src={$user?.avatar_url}
                                                    alt={$user.username[0]}
                                                />
                                                <Avatar.Fallback
                                                    class="bg-neutral-700 border-2 border-neutral-600"
                                                >
                                                    {($user?.username ?? "")
                                                        .split(" ")
                                                        .map((word) =>
                                                            word[0]?.toUpperCase()
                                                        )
                                                        .join("")
                                                        .slice(0, 3)}
                                                </Avatar.Fallback>
                                            </Avatar.Root>
                                            <span
                                                class="overflow-x-hidden overflow-ellipsis"
                                            >
                                                {$user?.username ||
                                                    "Non registrato"}
                                            </span>
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content align="start">
                                            <DropdownMenu.Label
                                                >Il mio account</DropdownMenu.Label
                                            >
                                            <DropdownMenu.Separator />
                                            <DropdownMenu.Group>
                                                <DropdownMenu.Item
                                                    class="flex gap-2 items-center"
                                                    disabled
                                                >
                                                    <Key
                                                        class="text-amber-500"
                                                    />
                                                    <div
                                                        class="flex flex-col gap-1"
                                                    >
                                                        Cambia Password
                                                        <span
                                                            class="text-xs italic"
                                                            >In arrivo...</span
                                                        >
                                                    </div>
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item
                                                    class="flex gap-2 items-center"
                                                    onclick={() => {
                                                        deleteModalOpen = true;
                                                        drawerOpen = false;
                                                    }}
                                                >
                                                    <Trash
                                                        class="text-red-500"
                                                    />
                                                    Elimina Account
                                                </DropdownMenu.Item>
                                            </DropdownMenu.Group>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>

                                    <form
                                        use:enhance
                                        method="POST"
                                        action="/?/logout"
                                        onsubmit={() => (drawerOpen = false)}
                                    >
                                        <button
                                            type="submit"
                                            class="flex items-center justify-center"
                                        >
                                            <LogOut class="text-red-400" />
                                        </button>
                                    </form>
                                </Card.Content>
                            </Card.Root>
                        {/if}
                    </div>
                </Drawer.Content>
            </Drawer.Root>
        {/if}
    </div>
</navbar>

<Dialog.Root bind:open={deleteModalOpen}>
    <Dialog.Content
        onOpenAutoFocus={(e) => {
            e.preventDefault();
        }}
    >
        <Dialog.Header>Elimina Account</Dialog.Header>
        <form
            action="/login?/delete"
            method="post"
            use:enhance
            onsubmit={() => {
                deleteModalOpen = false;
            }}
        >
            <div class="flex flex-col items-center justify-center gap-5 mb-5">
                <span class="text-xl">Vuoi eliminare questo account?</span>
                <div class="flex flex-col gap-2">
                    <span class="text-md">Nome: {$user?.username}</span>
                    <span class="text-md">E-mail: {$user?.email}</span>
                </div>
            </div>
            <Dialog.Footer>
                <Button type="submit" variant="destructive">Sì</Button>
                <Button
                    type="reset"
                    variant="outline"
                    onclick={() => (deleteModalOpen = false)}>No</Button
                >
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
