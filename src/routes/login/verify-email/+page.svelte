<script lang="ts">
    import { enhance } from "$app/forms";
    import type { User } from "$lib/auth/user";
    import { Button } from "$lib/components/ui/button/index";
    import * as InputOTP from "$lib/components/ui/input-otp/index";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    interface Props {
        data: User;
        form: any;
    }

    let { data, form }: Props = $props();

    if (!$user) $user = data;

    $effect(() => {
        if (form && form.error) {
            toast.error(form.message);
        }
    });

    let code = $state("");
    
    $effect(() => {
        if (code) {
            const upperCode = code.toUpperCase();
            if (upperCode !== code) {
                code = upperCode;
            }
        }
    });
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div
        class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow"
    >
        <h1 class="text-app-accent font-bold text-4xl">Verifica Email</h1>
        <p class="text-justify">
            Inserisci il codice di verifica ricevuto all'email <b
                class="text-app-accent">{$user.email}</b
            > per verificare il tuo account
        </p>
        <form
            use:enhance
            method="post"
            action="?/resendEmail"
            class="text-justify"
        >
            Se non hai ricevuto il codice, <button
                class="text-app-accent font-semibold">clicca qui</button
            > per richiederne un altro
        </form>

        <form
            use:enhance
            method="post"
            action="?/verifyCode"
            class="w-full flex flex-col items-center"
        >
            <InputOTP.Root
                maxlength={6}
                bind:value={code}
                class="flex gap-2"
                name="code"
            >
                {#snippet children({ cells })}
                    {#each cells.slice(0, 6) as cell (cell)}
                        <InputOTP.Group>
                            <InputOTP.Slot {cell} />
                        </InputOTP.Group>
                    {/each}
                {/snippet}
            </InputOTP.Root>
            <Button type="submit" class="mt-5 w-[90%]">Verifica</Button>
        </form>
    </div>
</section>
