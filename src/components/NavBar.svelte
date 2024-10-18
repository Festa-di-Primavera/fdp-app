<script lang="ts">
	import {
		Button,
		CloseButton,
		DarkMode,
		Drawer,
		Dropdown,
		DropdownItem,
		Modal,
		Accordion,
		AccordionItem
	} from 'flowbite-svelte';
	import {
		AlignJustify,
		DollarSign,
		DoorOpen,
		Home,
		LayoutDashboard,
		LogOut,
		ScanLine,
		ScrollText,
		Ticket,
		Users,
		Dna,
		NotepadText
	} from 'lucide-svelte';
	import { sineIn } from 'svelte/easing';
	import Logo from './Logo.svelte';

	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { hasPermission } from '$lib/utils/permissions';
	import { UserPermissions } from '$models/permissions';
	import { theme, user } from '$store/store';
	import ChangePwModal from './ChangePwModal.svelte';

	interface Route {
		label: string;
		slug?: string;
		permission?: number;
		icon: any;
		children?: Route[];
	}

	$: if ($page.url.pathname == '/login') {
		hidden = true;
	}

	const routes: Route[] = [
		{
			label: 'Home',
			slug: '/',
			icon: Home
		},
		{
			label: 'Gestione Utenti',
			icon: Users,
			permission: UserPermissions.UTENTI,
			children: [
				{
					label: 'Utenti',
					slug: '/users',
					icon: Users
				},
				{
					label: 'Blocchetti',
					slug: '/blocks',
					icon: NotepadText
				},
				{
					label: 'Incassi',
					slug: '/earns',
					icon: DollarSign
				}
			]
		},
		{
			label: 'Dashboard',
			slug: '/dashboard',
			permission: UserPermissions.DASHBOARD,
			icon: LayoutDashboard
		},
		{
			label: 'Biglietti',
			slug: '/tickets',
			permission: UserPermissions.LISTA_BIGLIETTI,
			icon: ScrollText
		},
		{
			label: 'Check-in',
			slug: '/check-in',
			permission: UserPermissions.CHECK_IN,
			icon: ScanLine
		},
		{
			label: 'Vendi',
			slug: '/sell',
			permission: UserPermissions.VENDITA,
			icon: DollarSign
		},
		{
			label: 'Check-out',
			slug: '/check-out',
			permission: UserPermissions.CHECK_OUT,
			icon: DoorOpen
		},
		{
			label: 'Info biglietto',
			slug: '/ticket-info',
			permission: UserPermissions.INFO_BIGLIETTO,
			icon: Ticket
		},
		{
			label: 'Genera biglietti',
			slug: '/generate',
			permission: UserPermissions.GENERAZIONE,
			icon: Dna
		}
	];

	function filterRoutes(routes: Route[]): Route[] {
		return routes.filter((route) => {
			return hasPermission($user?.permissions, route.permission);
		});
	}

	let hidden: boolean = true;
	let transitionParamsRight = {
		x: 200,
		duration: 200,
		easing: sineIn
	};

	function changeTheme() {
		if ($theme == 'dark') {
			$theme = 'light';
		} else {
			$theme = 'dark';
		}
	}

	let deleteModalOpen: boolean = false;

	let changePwModalOpen: boolean = false;
</script>

<navbar
	class="sticky top-0 z-[99] flex w-full items-center justify-between bg-gray-100 dark:bg-gray-900"
>
	<a class="my-2 ml-[1%]" href="/">
		<Logo />
	</a>
	<div class="mr-5 flex items-center justify-end gap-5">
		<button on:click={changeTheme} class="p-0">
			<DarkMode btnClass="text-gray-500 dark:text-gray-400 rounded-lg text-sm p-1.5" />
		</button>

		{#if $user !== null}
			<button
				on:click={() => {
					hidden = false;
				}}
				class="rounded-md border-2 border-black border-opacity-10 p-1 dark:border-white dark:border-opacity-20"
				><AlignJustify class="text-gray-500 dark:text-gray-400" /></button
			>
		{/if}
	</div>
</navbar>
<Drawer
	class="z-[100] max-h-screen overflow-y-hidden"
	placement="right"
	transitionType="fly"
	transitionParams={transitionParamsRight}
	width="w-72"
	bind:hidden
>
	<div class="flex h-full w-full flex-col">
		<div class="flex items-center">
			<h4 class=" mb-4 items-center text-2xl font-semibold text-gray-500 dark:text-gray-400">
				Menu
			</h4>
			<CloseButton on:click={() => (hidden = true)} class="mb-4 dark:text-white" />
		</div>
		<div class="flex h-full flex-col justify-between sidebar">
			<!-- Sezione dei pulsanti -->
			<div class="py-2 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-10rem)]">
			  {#each filterRoutes(routes) as route}
				{#if route.children}
				  <Accordion flush>
					<AccordionItem borderBottomClass="" paddingFlush="p-0 justify-start" open={route.children.some(child => child.slug === $page.url.pathname)}>
					  <span slot="header" class="flex gap-4 mr-4 text-xl w-max items-center font-normal">
						<svelte:component this={route.icon}/>
						{route.label}
					  </span>
					  <div class="pl-5 mt-2">
						{#each route.children as childRoute}
						  <a on:click={() => (hidden = true)} class={`${childRoute.slug == $page.url.pathname ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} href={childRoute.slug}>
							<span class="flex gap-4 w-full text-xl items-center py-2">
							  <svelte:component this={childRoute.icon}/>
							  {childRoute.label}
							</span>
						  </a>
						{/each}
					  </div>
					</AccordionItem>
				  </Accordion>
				{:else}
				  <a on:click={() => (hidden = true)} class={`${route.slug == $page.url.pathname ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} href={route.slug}>
					<span class="flex gap-4 w-full text-xl items-center">
					  <svelte:component this={route.icon}/>
					  {route.label}
					</span>
				  </a>
				{/if}
			  {/each}
			</div>
			
			<!-- Div in fondo -->
			{#if $user !== null}
			  <div class="mx-auto text-md flex w-full items-center justify-between self-baseline rounded-lg bg-gray-100 p-3 dark:bg-gray-600 dark:text-white">
				<button id="account" class="text-md flex items-center gap-4 truncate overflow-ellipsis pr-5">
				  {#if $user?.avatar_url}
					<img loading="lazy" src={$user?.avatar_url} alt={$user.username[0]} class="h-8 w-8 rounded-full"/>
				  {:else}
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-400 font-mono text-white">
					  <span>{$user?.username[0].toUpperCase()}</span>
					</div>
				  {/if}
				  <span class="overflow-x-hidden overflow-ellipsis">{$user?.username || 'Non registrato'}</span>
				</button>
				<Dropdown placement="top" triggeredBy="#account">
				  <DropdownItem>
					<button on:click={() => { changePwModalOpen = true; hidden = true; }}>Cambia Password</button>
				  </DropdownItem>
				  <DropdownItem slot="footer">
					<button class="text-red-400" on:click={() => { deleteModalOpen = true; hidden = true; }}>Elimina Account</button>
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
	on:close={() => (deleteModalOpen = false)}
	size="sm"
	class="z-50"
>
	<form
		action="/login?/delete"
		method="post"
		use:enhance
		on:submit={() => {
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
		<Button type="reset" color="alternative" on:click={() => (deleteModalOpen = false)}>No</Button>
	</form>
</Modal>
<ChangePwModal bind:changePwModalOpen />