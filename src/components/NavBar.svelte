<script lang="ts">
    import {
        Accordion,
        AccordionItem,
        Button,
        CloseButton,
        DarkMode,
        Drawer,
        Dropdown,
        DropdownItem,
        Modal,
    } from "flowbite-svelte";
    import {
        AlignJustify,
        ChefHat,
        CoinsIcon,
        Dna,
        DollarSign,
        Home,
        Info,
        LayoutDashboard,
        LogOut,
        NotepadText,
        ScanLine,
        ScanQrCode,
        ScrollText,
        Ticket,
        UserCog,
        Users,
    } from "lucide-svelte";
    import { sineIn } from "svelte/easing";
    import Logo from "./Logo.svelte";

    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import { hasPermission } from "$lib/utils/permissions";
    import { UserPermissions } from "$models/permissions";
    import { theme, user } from "$store/store";

    interface Route {
        label: string;
        slug?: string;
        permission?: number;
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
            icon: Home,
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
                    slug: "/earns",
                    icon: DollarSign,
                },
            ],
        },
        {
            label: "Biglietti",
            icon: Ticket,
            permission: UserPermissions.UTENTI,
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
            label: "Cucina",
            slug: "/kitchen",
            permission: UserPermissions.CUCINA,
            icon: ChefHat,
        },
        // {
        //     label: "Checkpoint Don Bosco",
        //     slug: "/checkpoint",
        //     permission: UserPermissions.CASSA,
        //     icon: ScanQrCode,
        // },
    ];

    function filterRoutes(routes: Route[]): Route[] {
        return routes.filter((route) => {
            if (!hasPermission($user?.permissions, route.permission)) {
                return false;
            }
            
            if (route.children) {
                route.children = route.children.filter((child) => 
                    hasPermission($user?.permissions, child.permission)
                );
                return route.children.length > 0;
            }
            
            return true;
        });
    }

    let hidden: boolean = $state(true);
    let transitionParamsRight = {
        x: 200,
        duration: 200,
        easing: sineIn,
    };

    function changeTheme() {
        if ($theme == "dark") {
            $theme = "light";
        } else {
            $theme = "dark";
        }
    }

    let deleteModalOpen: boolean = $state(false);
</script>

<navbar
    class="sticky top-0 z-40 flex w-full items-center justify-between bg-gray-100 dark:bg-gray-900"
>
    <a class="my-2 ml-[1%]" href="/">
        <Logo />
    </a>
    <div class="mr-5 flex items-center justify-end gap-5">
        <DarkMode
            onclick={changeTheme}
            btnClass="text-gray-500 dark:text-gray-400 rounded-lg text-sm p-1.5"
        />

        {#if $user !== null}
            <button
                onclick={() => {
                    hidden = false;
                }}
                class="rounded-md border-2 border-black border-opacity-10 p-1 dark:border-white dark:border-opacity-20"
                ><AlignJustify
                    class="text-gray-500 dark:text-gray-400"
                /></button
            >
        {/if}
    </div>
</navbar>
<Drawer
    class="z-50 max-h-screen overflow-y-hidden"
    placement="right"
    transitionType="fly"
    transitionParams={transitionParamsRight}
    width="w-72"
    bind:hidden
>
    <div class="flex h-full w-full flex-col">
        <div class="flex items-center">
            <h4
                class=" mb-4 items-center text-2xl font-semibold text-gray-500 dark:text-gray-400"
            >
                Menu
            </h4>
            <CloseButton
                on:click={() => (hidden = true)}
                class="mb-4 dark:text-white"
            />
        </div>
        <div class="sidebar flex h-full flex-col justify-between">
            <!-- Sezione dei pulsanti -->
            <div
                class="flex max-h-[calc(100vh-10rem)] flex-col gap-4 overflow-y-auto py-2"
            >
                {#each filterRoutes(routes) as route}
                    {#if route.children}
                        <Accordion flush>
                            <AccordionItem
                                borderBottomClass=""
                                paddingFlush="p-0 justify-start"
                                open={route.children.some(
                                    (child) => child.slug === page.url.pathname
                                )}
                            >
                                <span
                                    slot="header"
                                    class="mr-4 flex w-max items-center gap-4 text-xl font-normal"
                                >
                                    <route.icon />
                                    {route.label}
                                </span>
                                <div class="mt-2 pl-5">
                                    {#each route.children as childRoute}
                                        <a
                                            onclick={() => (hidden = true)}
                                            class={`${childRoute.slug == page.url.pathname ? "text-primary-500" : "text-gray-500 dark:text-gray-400"}`}
                                            href={childRoute.slug}
                                        >
                                            <span
                                                class="flex w-full items-center gap-4 py-2 text-xl"
                                            >
                                                <childRoute.icon />
                                                {childRoute.label}
                                            </span>
                                        </a>
                                    {/each}
                                </div>
                            </AccordionItem>
                        </Accordion>
                    {:else}
                        <a
                            onclick={() => (hidden = true)}
                            class={`${route.slug == page.url.pathname ? "text-primary-500" : "text-gray-500 dark:text-gray-400"}`}
                            href={route.slug}
                        >
                            <span
                                class="flex w-full items-center gap-4 text-xl"
                            >
                                <route.icon />
                                {route.label}
                            </span>
                        </a>
                    {/if}
                {/each}
            </div>

            <!-- Div in fondo -->
            {#if $user !== null}
                <div
                    class="text-md mx-auto flex w-full items-center justify-between self-baseline rounded-lg bg-gray-100 p-3 dark:bg-gray-600 dark:text-white"
                >
                    <button
                        id="account"
                        class="text-md flex items-center gap-4 truncate overflow-ellipsis pr-5"
                    >
                        {#if $user?.avatar_url}
                            <img
                                loading="lazy"
                                src={$user?.avatar_url}
                                alt={$user.username[0]}
                                class="h-8 w-8 rounded-full"
                            />
                        {:else}
                            <div
                                class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white"
                            >
                                <span>{$user?.username[0].toUpperCase()}</span>
                            </div>
                        {/if}
                        <span class="overflow-x-hidden overflow-ellipsis"
                            >{$user?.username || "Non registrato"}</span
                        >
                    </button>
                    <Dropdown placement="top" triggeredBy="#account">
                        <DropdownItem>
                            <button
                                class="text-red-400"
                                onclick={() => {
                                    deleteModalOpen = true;
                                    hidden = true;
                                }}>Elimina Account</button
                            >
                        </DropdownItem>
                    </Dropdown>

                    <form use:enhance method="post" action="/">
                        <button type="submit">
                            <LogOut class="text-gray-500 dark:text-white" />
                        </button>
                    </form>
                </div>
            {/if}
        </div>
    </div>
</Drawer>
<Modal
    title="Elimina account"
    outsideclose
    bind:open={deleteModalOpen}
    onclose={() => (deleteModalOpen = false)}
    size="sm"
    class="z-50"
>
    <form
        action="/login?/delete"
        method="post"
        use:enhance
        onsubmit={() => {
            deleteModalOpen = false;
        }}
    >
        <div class="flex flex-col items-center justify-center gap-5">
            <span class="text-xl">Vuoi eliminare questo account?</span>
            <div class="flex flex-col gap-2">
                <span class="text-md">Nome: {$user?.username}</span>
                <span class="text-md">E-mail: {$user?.email}</span>
            </div>
        </div>
        <Button type="submit" color="red">Sì</Button>
        <Button
            type="reset"
            color="alternative"
            on:click={() => (deleteModalOpen = false)}>No</Button
        >
    </form>
</Modal>
