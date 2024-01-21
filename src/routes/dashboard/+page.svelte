<script lang="ts">
	import { onMount } from 'svelte';
	import { handleSignOut, user } from '../../store/store';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	const auth = getAuth();

	onAuthStateChanged(auth, (newUser) => {
	  $user = newUser;
	});
</script>

<h1 class="text-primary-600">DASHBOARD</h1>
<p>Questa e' la dashboard</p>

{#if $user !== null}
	<div class="flex items-center gap-4">
	{#if $user.photoURL}
		<img src={$user.photoURL} alt="Profile" style="width: 50px; height: 50px; border-radius: 50%;">
	{/if}
	<p>Hi {$user.displayName}</p>
	</div>
	<button on:click={handleSignOut}>LOGOUT</button>
{/if}