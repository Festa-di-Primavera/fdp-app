<script lang="ts">
    import { DarkMode, Drawer, CloseButton } from "flowbite-svelte";
	import { AlignJustify } from 'lucide-svelte';
	import Logo from "./Logo.svelte";
	import MenuSide from "./MenuSide.svelte";
  	import { sineIn } from 'svelte/easing';


	import { page } from '$app/stores';  
	
	const currentRole = "ADMIN";

	const routes = [
		{
			label: 'Dashboard',
			slug: "/dashboard",
			role: "ADMIN" 
		},
		{
			label: 'Sell',
			slug: "/sell",
			role: "SELLER" 
		},
		{
			label: 'Check-in',
			slug: "/check-in",
			role: "CHECKER"
		}
	]


	let hidden: boolean = true;
	let transitionParamsRight = {
		x: 200,
		duration: 200,
		easing: sineIn
	};
</script>
	
<navbar class="flex items-center justify-between w-full bg-gray-100 dark:bg-gray-900">
	<a class="ml-[1%] my-2" href="/">
		<Logo/>
	</a>
	<div class="flex items-center justify-end gap-4">
		<DarkMode btnClass='mx-3 md:mx-8 text-gray-500 dark:text-gray-400 rounded-lg text-sm p-2.5'/>
		<button on:click={()=> {hidden = false}}><AlignJustify class="text-gray-500 dark:text-gray-400 mr-5"/></button>
	</div>
</navbar>
<Drawer placement="right" transitionType="fly" transitionParams={transitionParamsRight} width="w-72" bind:hidden>
	<div class="flex items-center">
		<h4 class=" items-center mb-4 text-xl font-semibold text-gray-500 dark:text-gray-400">
			Menu
		</h4>
		<CloseButton on:click={() => (hidden = true)} class="mb-4 dark:text-white" />
	  </div>
	<div class="flex flex-col gap-4">
		{#each routes as route}
			{#if route.role == currentRole || currentRole == "ADMIN"}
				<a on:click={() => (hidden = true)} class={`${route.slug == $page.url.pathname ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} href={route.slug}>{route.label}</a>
			{/if}
		{/each}
	</div>
</Drawer>