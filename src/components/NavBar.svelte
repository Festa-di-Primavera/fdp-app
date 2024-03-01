<script lang="ts">
    import { DarkMode, Drawer, CloseButton, Dropdown, DropdownItem, Modal, Button } from "flowbite-svelte";
	import { AlignJustify, DollarSign, LayoutDashboard, LogOut, ScanLine, Ticket, Users, Home} from 'lucide-svelte';
	import Logo from "./Logo.svelte";
  	import { sineIn } from 'svelte/easing';

	import { page } from '$app/stores';  
	import { user, theme } from "../store/store";
	import { onIdTokenChanged, getAuth, deleteUser, } from "firebase/auth";
	import { getClientApp, handleSignOut } from "$lib/firebase/client";
	import { roles } from "../models/role";
	import ChangePwModal from "./ChangePwModal.svelte";
	import ChangeEmailModal from "./ChangeEmailModal.svelte";
	
	let currAccessLevel: number | null = null;
	let color: string = '#000';

	onIdTokenChanged(getAuth(getClientApp()), async (user) => {
		if(user !== null){
			$user = user;
			try{
				const claims = (await user.getIdTokenResult(true))?.claims;
				currAccessLevel = (claims?.accessLevel as number);
				color = claims?.color as string;
			}
			catch(e){
				console.error(e);
			}
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
		{
			label: 'Info biglietti',
			slug: "/ticket-info",
			role: roles.SELLER,
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

	const newShade = (hexColor: string, magnitude: number) => {
		hexColor = hexColor.replace(`#`, ``);
		if (hexColor.length === 6) {
			const decimalColor = parseInt(hexColor, 16);
			let r = (decimalColor >> 16) + magnitude;
			r > 255 && (r = 255);
			r < 0 && (r = 0);
			let g = (decimalColor & 0x0000ff) + magnitude;
			g > 255 && (g = 255);
			g < 0 && (g = 0);
			let b = ((decimalColor >> 8) & 0x00ff) + magnitude;
			b > 255 && (b = 255);
			b < 0 && (b = 0);
			return `#${(g | (b << 8) | (r << 16)).toString(16)}`;
		} else {
			return hexColor;
		}
	};

	let deleteModalOpen: boolean = false;
	function deleteCurrentUser(){
		if($user !== null){
			deleteUser($user).then(() => {
				deleteModalOpen = false;
			}).catch((error) => {
				console.error(error);
			});
		}
	}

	let changePwModalOpen: boolean = false;
	let changeEmailModalOpen: boolean = false;
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
					<button id="account" class="flex gap-4 text-md items-center truncate overflow-ellipsis pr-5">
						<div style="background: linear-gradient(335deg, {newShade(color || '#000', 50)}, {newShade(color || '#000', -10)});" class="h-7 min-w-7 rounded-full flex items-center justify-center text-white" >
							{$user.displayName?.charAt(0).toUpperCase() || 'NO'}
						</div>
						
						<span class="overflow-x-hidden overflow-ellipsis">{$user.displayName || 'Non registrato'}</span>
					</button>
					<Dropdown placement="top" triggeredBy="#account">
						<DropdownItem>
							<button on:click={() =>{ changePwModalOpen = true; hidden=true}}>Cambia Password</button>
						</DropdownItem>
						<DropdownItem>
							<button on:click={() =>{ changeEmailModalOpen = true; hidden=true}}>Cambia Email</button>
						</DropdownItem>
						<DropdownItem slot="footer">
							<button class="text-red-400" on:click={() =>{ deleteModalOpen = true; hidden=true}}>Elimina Account</button>
						</DropdownItem>
					</Dropdown>
					
					<button on:click={() => {handleSignOut(); hidden=true}}>
						<LogOut class="text-gray-500 dark:text-white"/>
					</button>
				</div>
			{/if}
		</div>
	</div>
</Drawer>
<Modal title="Elimina account" outsideclose autoclose bind:open={deleteModalOpen} on:close={() => deleteModalOpen = false} size="sm" class="z-50">
	<div class="flex flex-col gap-5 items-center justify-center">
		<span class="text-xl">Vuoi eliminare questo account?</span>
		<div class="flex flex-col gap-2">
			<span class="text-md">Nome: {$user?.displayName}</span>
			<span class="text-md">E-mail: {$user?.email}</span>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button on:click={deleteCurrentUser} color="red">Si</Button>
		<Button on:click={() => deleteModalOpen = false} color="alternative">No</Button>
	</svelte:fragment>
</Modal>
<ChangePwModal bind:changePwModalOpen/>
<ChangeEmailModal bind:changeEmailModalOpen/>