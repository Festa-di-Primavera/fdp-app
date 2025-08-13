<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import { Button } from "$lib/components/ui/button/index";
    import { Label } from "$lib/components/ui/label/index";
    import * as Password from "$lib/components/ui/password/index";
    import { toast } from "svelte-sonner";

    let { form } = $props();
    $effect(() => {
        if (form && form.error) {
            toast.error(form.message);
        }
    });

    let newPassword: string = $state("");
    let repeatPassword: string = $state("");

    let validatorError: boolean = $derived(!(newPassword === repeatPassword));

    let lessThanEightChars = $state(false);
    let noUpperCase = $state(false);
    let noNumber = $state(false);
    let noSpecialChar = $state(false);

    function validatePassword() {
        lessThanEightChars = newPassword.length < 8;
        noUpperCase = !/[A-Z]/.test(newPassword);
        noNumber = !/[0-9]/.test(newPassword);
        noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(
            newPassword
        );
    }
    let disableButton = $derived(
        newPassword == "" ||
            repeatPassword == "" ||
            validatorError ||
            lessThanEightChars ||
            noUpperCase ||
            noNumber ||
            noSpecialChar
    );
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div
        class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow"
    >
        <h1 class="text-app-accent font-bold text-4xl">Reset Password</h1>
        <p class="text-justify">
            Inserisci la nuova password per fare il reset
        </p>
        <form
            use:enhance
            action="?/passwordReset"
            method="post"
            class="w-full flex flex-col items-center"
        >
            <div class="w-full mb-3">
                <Label for="password">Password</Label>
                <Password.Root>
                    <Password.Input
                        id="password"
                        name="password"
                        required
                        bind:value={newPassword}
                        onblur={validatePassword}
                    >
                        <Password.ToggleVisibility />
                    </Password.Input>
                    <Password.Helper enabled={lessThanEightChars} color="red">
                        La password contiene meno di 8 caratteri
                    </Password.Helper>
                    <Password.Helper enabled={noUpperCase} color="red">
                        La password non ha maiuscole
                    </Password.Helper>
                    <Password.Helper enabled={noNumber} color="red">
                        La password non ha numeri
                    </Password.Helper>
                    <Password.Helper enabled={noSpecialChar} color="red">
                        La password non ha caratteri speciali
                    </Password.Helper>
                </Password.Root>
            </div>

            <div class="w-full">
                <Label for="password_repeat">Conferma Password</Label>
                <Password.Root>
                    <Password.Input
                        id="password_repeat"
                        name="password_repeat"
                        required
                        bind:value={repeatPassword}
                        onblur={() =>
                            (validatorError = !(newPassword === repeatPassword))}
                    >
                        <Password.ToggleVisibility />
                    </Password.Input>
                    <Password.Helper enabled={validatorError} color="red">
                        Le password non corrispondono
                    </Password.Helper>
                </Password.Root>
            </div>

            <input type="hidden" name="token" value={page.params.token} />

            <Button class="mt-5 w-[90%]" type="submit" disabled={disableButton}>
                Resetta password
            </Button>
        </form>
    </div>
</section>
