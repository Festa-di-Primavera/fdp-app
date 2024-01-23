<script lang="ts">
    import { signInWithRedirect, GoogleAuthProvider, type User, onAuthStateChanged } from "firebase/auth";
	import { clientAuth } from '$lib/firebase/firebase';
	import { Button } from "flowbite-svelte";

    let currentUser: User | null = null;
	const provider = new GoogleAuthProvider();

    const handleSignIn = async () => {
        signInWithRedirect(clientAuth, provider)
        .then((result: any) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);

            const token = credential!.accessToken;
            currentUser = result.user;
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            
            const email = error.customData.email;
            
            const credential = GoogleAuthProvider.credentialFromError(error);
        });
    }

    onAuthStateChanged(clientAuth, (user) => {
        currentUser = user;
    });

</script>

<div>
	<div>
		<Button color="primary" class="my-2 w-64" on:click={handleSignIn}> Google </Button>
	</div>
</div>
