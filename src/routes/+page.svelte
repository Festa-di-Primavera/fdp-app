<script lang="ts">
	import AuthPanel from '../components/AuthPanel.svelte';
	import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
	import { handleSignOut, user } from '../store/store';
  
	const auth = getAuth();
  
	onAuthStateChanged(auth, (newUser) => {
	  $user = newUser;
	});
  </script>
  
  <section class="w-full m-auto px-5 py-5 text-xl text-black dark:text-white">
	{#if $user === null}
	  <h1>Welcome, log in to proceed</h1>
	  <AuthPanel />
	{/if}
  
	{#if $user !== null}
	  <div class="flex items-center gap-4">
		{#if $user.photoURL}
		  <img src={$user.photoURL} alt="Profile" style="width: 50px; height: 50px; border-radius: 50%;">
		{/if}
		<p>Hi {$user.displayName}</p>
	  </div>
	  <button on:click={handleSignOut}>LOGOUT</button>
	{/if}
  </section>
  