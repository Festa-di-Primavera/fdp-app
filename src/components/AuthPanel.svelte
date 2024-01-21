<script lang="ts">
    import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, type User, onAuthStateChanged } from "firebase/auth";
	import { auth } from '$lib/firebase/firebase';

    let currentUser: User | null = null;
	const provider = new GoogleAuthProvider();

    const handleSignIn = async () => {
        signInWithRedirect(auth, provider)
        .then((result) => {

            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);

            const token = credential!.accessToken;
            // The signed-in user info.
            // const user = result.user;
            currentUser = result.user;
            // console.log(currentUser);
            // IdP data available using getAdditionalUserInfo(result)
            // ...
        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
        });
    }

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
    });

</script>

<div>
	<!-- {#if errorMessage.length}
		<p color="danger">{errorMessage}</p>
	{/if} -->
	<div>
		<button color="primary" class="my-2 w-64" on:click={handleSignIn}> Google </button>
	</div>

</div>
