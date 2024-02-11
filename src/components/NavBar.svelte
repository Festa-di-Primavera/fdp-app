<script lang="ts">
    import { DarkMode, Drawer, CloseButton } from "flowbite-svelte";
	import { AlignJustify, DollarSign, LayoutDashboard, LogOut, ScanLine, User, Ticket, Users, Home } from 'lucide-svelte';
	import Logo from "./Logo.svelte";
  	import { sineIn } from 'svelte/easing';

	import { page } from '$app/stores';  
	import { handleSignOut, user } from "../store/store";
	import { onIdTokenChanged, getAuth } from "firebase/auth";
	import { getClientApp } from "$lib/firebase/client";
	import { roles } from "../models/role";
	
	let currAccessLevel: number | null = null;
	let color: string = '#000';

	onIdTokenChanged(getAuth(getClientApp()), async (user) => {
		if(user !== null){
			$user = user;
			const claims = (await user.getIdTokenResult(true))?.claims;
			currAccessLevel = (claims?.accessLevel as number);
			color = claims?.color as string;
		}
	});

	const routes = [
		{
			label: 'Home',
			slug: "/",
			role: roles.NORMAL,
			icon: Home
		},
		{
			label: 'Dashboard',
			slug: "/dashboard",
			role: roles.ADMIN,
			icon: LayoutDashboard
		},
		{
			label: 'Utenti',
			slug: "/users",
			role: roles.SUPERADMIN,
			icon: Users
		},
		{
			label: 'Generate',
			slug: "/generate",
			role: roles.SUPERADMIN,
			icon: Ticket
		},
		{
			label: 'Check-in',
			slug: "/check-in",
			role: roles.CHECKIN,
			icon: ScanLine
		},
		{
			label: 'Vendi',
			slug: "/sell",
			role: roles.SELLER,
			icon: DollarSign
		},
	]

	let hidden: boolean = true;
	let transitionParamsRight = {
		x: 200,
		duration: 200,
		easing: sineIn
	};
</script>
	
<navbar class="z-[99] sticky top-0 flex items-center justify-between w-full bg-gray-100 dark:bg-gray-900">
	<a class="ml-[1%] my-2" href="/">
		<Logo/>
	</a>
	<div class="flex items-center justify-end">
		<DarkMode btnClass='text-gray-500 mr-5 dark:text-gray-400 rounded-lg text-sm p-1.5'/>
		{#if $user !== null}
			<button on:click={()=> {hidden = false}} class="p-1 mr-5 rounded-md border-2 border-black dark:border-white dark:border-opacity-20 border-opacity-10"><AlignJustify class="text-gray-500 dark:text-gray-400"/></button>
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
			{#if currAccessLevel !== null}
				<div class="flex flex-col gap-4 mt-5">
					{#each routes as route}
						{#if route.role <= currAccessLevel}
							<a on:click={() => (hidden = true)} class={`${route.slug == $page.url.pathname ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} href={route.slug}>
								<span class="flex gap-4 w-full text-xl items-center">
									<svelte:component this={route.icon}/>
									{route.label}
								</span>
							</a>
						{/if}
					{/each}
				</div>
			{/if}
			{#if $user !== null}
				<div class="dark:text-white flex text-md items-center self-baseline w-full justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-600">
					<div class="flex gap-4 text-md items-center truncate overflow-ellipsis pr-5">
						<div style="background: {color || '#000'};" class="h-7 min-w-7 rounded-full flex items-center justify-center" >
							{$user.displayName?.charAt(0).toUpperCase() || 'NO'}
						</div>
						<span class="overflow-x-hidden overflow-ellipsis">{$user.displayName || 'Non registrato'}</span>
					</div>
					
					<button on:click={() => {handleSignOut(); hidden=true}}>
						<LogOut class="text-gray-500 dark:text-white"/>
					</button>
				</div>
			{/if}
		</div>
	</div>
</Drawer>