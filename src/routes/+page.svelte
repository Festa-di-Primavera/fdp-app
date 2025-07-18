<script lang="ts">
    import { enhance } from "$app/forms";
    import type { User } from "$lib/auth/user";
    import { user } from "$store/store";
    import { AlertCircle, LogOut, XCircle } from "lucide-svelte";
    import FeedbackToast from "../components/feedbacks/FeedbackToast.svelte";
    import { Button } from "$lib/components/ui/button/index";

    let { data } = $props();
    $user = data as User;

    let feedbackToastMessage: string = $state("");
    let feedbackToastOpen: boolean = $state(false);
    let error: boolean = $state(false);
    let color: "red" | "yellow" = $derived(error ? "red" : "yellow");

    let ToastIcon = $derived(error ? AlertCircle : XCircle);
</script>

<svelte:head>
    <title>Festa di Primavera</title>
</svelte:head>

<section
    class="flex w-full flex-grow flex-col items-center justify-start px-5 py-10 text-xl"
>
    <div class="flex flex-col items-center">
        <div class="flex flex-col items-center gap-4 text-center">
            <h1 class="text-3xl font-semibold text-chart-2">Home</h1>
            <p class="text-center text-2xl">Ciao <b>{data?.username}</b>!</p>
            <p class="text-center">Questa è solo la home page!</p>
            <p class="flex items-end">
                Per iniziare ad usare l'applicazione usa il menu in alto a
                destra
            </p>
            <form
                method="POST"
                action="?/logout"
                use:enhance
                class="mt-5 flex flex-col items-center gap-8 text-center"
            >
                Se invece vuoi uscire dall'applicazione, clicca qui sotto
                <Button
                    variant="destructive"
                    class="flex items-center justify-center gap-2"
                >
                    Esci dall'app
                    <LogOut class="h-4 w-4" />
                </Button>
            </form>
        </div>
    </div>
</section>

<FeedbackToast
    bind:open={feedbackToastOpen}
    {color}
    bind:message={feedbackToastMessage}
    {ToastIcon}
/>
