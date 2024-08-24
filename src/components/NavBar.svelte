<script lang="ts">
    import { Button, CloseButton, DarkMode, Drawer, Dropdown, DropdownItem, Modal } from "flowbite-svelte";
    import { AlignJustify, DollarSign, DoorOpen, Home, LayoutDashboard, LogOut, ScanLine, Ticket, Users } from 'lucide-svelte';
    import { sineIn } from 'svelte/easing';
    import Logo from "./Logo.svelte";

	import { page } from '$app/stores';
	import { Role } from "../models/role";
	import { theme, user } from "../store/store";
	import ChangePwModal from "./ChangePwModal.svelte";
	import { enhance } from "$app/forms";
	

	// TODO: auto update claims when admin changes them. Use realtime firestore listener
	
	$: if($page.url.pathname == '/login'){
		hidden = true;
	}

	const routes = [
		{
			label: 'Home',
			slug: "/",
			role: Role.NORMAL,
			icon: Home
		},
		{
			label: 'Dashboard',
			slug: "/dashboard",
			role: Role.ADMIN,
			icon: LayoutDashboard
		},
		{
			label: 'Utenti',
			slug: "/users",
			role: Role.SUPERADMIN,
			icon: Users
		},
		{
			label: 'Check-in',
			slug: "/check-in",
			role: Role.CHECKIN,
			icon: ScanLine
		},
		{
			label: 'Vendi',
			slug: "/sell",
			role: Role.SELLER,
			icon: DollarSign
		},
		{
			label: 'Check-out',
			slug: "/check-out",
			role: Role.CHECKOUT,
			icon: DoorOpen
		},
		{
			label: 'Info biglietti',
			slug: "/ticket-info",
			role: Role.CHECKOUT,
			icon: Ticket
		},
	]

	let hidden: boolean = true;
	let transitionParamsRight = {
		x: 200,
		duration: 200,
		easing: sineIn
	};

	function changeTheme() {
		if($theme == 'dark'){
			$theme = 'light'
		}
		else{
			$theme = 'dark'
		}
	}

	let deleteModalOpen: boolean = false;

	let changePwModalOpen: boolean = false;		
</script>
	
<navbar class="z-[99] sticky top-0 flex items-center justify-between w-full bg-gray-100 dark:bg-gray-900">
	<a class="ml-[1%] my-2" href="/">
		<Logo/>
	</a>
	<div class="flex items-center justify-end mr-5 gap-5">
		<button on:click={changeTheme} class="p-0">
			<DarkMode btnClass='text-gray-500 dark:text-gray-400 rounded-lg text-sm p-1.5'/>
		</button>
		
		{#if $user !== null}
			<button on:click={()=> {hidden = false}} class="p-1 rounded-md border-2 border-black dark:border-white dark:border-opacity-20 border-opacity-10"><AlignJustify class="text-gray-500 dark:text-gray-400"/></button>
		{/if}
	</div>
</navbar>
<Drawer class="z-[100]" placement="right" transitionType="fly" transitionParams={transitionParamsRight} width="w-72" bind:hidden>
	<div class="h-full w-full flex flex-col">	
		<div class="flex items-center">
			<h4 class=" items-center mb-4 text-2xl font-semibold text-gray-500 dark:text-gray-400">
				Menu
			</h4>
			<CloseButton on:click={() => (hidden = true)} class="mb-4 dark:text-white" />
		</div>
		<hr class="dark:border-gray-600"/>
		<div class="flex flex-col justify-between h-full">
			{#if $user?.access_level !== null}
				<div class="flex flex-col gap-4 mt-5">
					{#each routes as route}
						{#if route.slug != '/check-out'}
							{#if route.role <= ($user?.access_level || Role.NORMAL)}
								<a on:click={() => (hidden = true)} class={`${route.slug == $page.url.pathname ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} href={route.slug}>
									<span class="flex gap-4 w-full text-xl items-center">
										<svelte:component this={route.icon}/>
										{route.label}
									</span>
								</a>
							{/if}
						{:else}
							{#if $user?.access_level == Role.CHECKOUT || ($user?.access_level || Role.NORMAL) >= Role.ADMIN}
								<a on:click={() => (hidden = true)} class={`${route.slug == $page.url.pathname ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} href={route.slug}>
									<span class="flex gap-4 w-full text-xl items-center">
										<svelte:component this={route.icon}/>
										{route.label}
									</span>
								</a>
							{/if}
						{/if}
					{/each}
				</div>
			{/if}
			{#if $user !== null}
				<div class="dark:text-white flex text-md items-center self-baseline w-full justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-600">
					<button id="account" class="flex gap-4 text-md items-center truncate overflow-ellipsis pr-5">
						{#if $user?.avatar_url}
							<img src={$user?.avatar_url} alt="{$user.username[0]}" class="rounded-full w-8 h-8"/>
						{:else}
							<div class="rounded-full w-8 h-8 bg-gradient-to-br from-primary-700 to-primary-400 flex items-center justify-center text-white font-mono">
								<span>{$user?.username[0].toUpperCase()}</span>
							</div>
						{/if}
						<span class="overflow-x-hidden overflow-ellipsis">{$user?.username || 'Non registrato'}</span>
					</button>
					<Dropdown placement="top" triggeredBy="#account">
						<DropdownItem>
							<button on:click={() =>{ changePwModalOpen = true; hidden=true}}>Cambia Password</button>
						</DropdownItem>
						<DropdownItem slot="footer">
							<button class="text-red-400" on:click={() =>{ deleteModalOpen = true; hidden=true}}>Elimina Account</button>
						</DropdownItem>
					</Dropdown>
					
					<form use:enhance method="post" action="/">
						<button type="submit">
							<LogOut class="text-gray-500 dark:text-white"/>
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
</Drawer>
<Modal title="Elimina account" outsideclose bind:open={deleteModalOpen} on:close={() => deleteModalOpen = false} size="sm" class="z-50">
	<form action="/login?/delete" method="post" use:enhance on:submit={() => {deleteModalOpen = false}}>
		<div class="flex flex-col gap-5 items-center justify-center">
			<span class="text-xl">Vuoi eliminare questo account?</span>
			<div class="flex flex-col gap-2">
				<span class="text-md">Nome: {$user?.username}</span>
				<span class="text-md">E-mail: {$user?.email}</span>
			</div>
		</div>
		<Button type="submit" color="red">Sì</Button>
		<Button type="reset" color="alternative" on:click={() => deleteModalOpen = false}>No</Button>
	</form>
</Modal>
<ChangePwModal bind:changePwModalOpen/>