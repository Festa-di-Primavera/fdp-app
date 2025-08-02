<script lang="ts">
    import { Button } from "$lib/components/ui/button/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";

    import { enhance } from "$app/forms";
    import * as Card from "$lib/components/ui/card/index";
    import * as Password from "$lib/components/ui/password/index";
    import Separator from "$lib/components/ui/separator/separator.svelte";
    import * as Tabs from "$lib/components/ui/tabs/index";
    import { user } from "$store/store";
    import { toast } from "svelte-sonner";

    $user = null;
    let option: "login" | "register" = $state("login");

    let username: string = $state("");
    let email: string = $state("");
    let password: string = $state("");
    let repeatPassword: string = $state("");

    interface Props {
        form: {
            error: boolean;
            message: string;
        };
    }

    let { form }: Props = $props();

    $effect(() => {
        if (form) {
            if (form.error) {
                toast.error(form.message);
            } else {
                toast.success(form.message);
            }
        }
    });

    let lessThanEightChars = $state(false);
    let noUpperCase = $state(false);
    let noNumber = $state(false);
    let noSpecialChar = $state(false);
    let usernameValidator: boolean = $derived(
        option === "login" ? false : !/^[a-zA-Z0-9_\ ]*$/.test(username)
    );
    let validatorError: boolean = $derived(!(password === repeatPassword));

    function validatePassword() {
        lessThanEightChars = password.length < 8;
        noUpperCase = !/[A-Z]/.test(password);
        noNumber = !/[0-9]/.test(password);
        noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(
            password
        );
    }
</script>

{#snippet passwordField()}
    <Label for="password">Password</Label>
    <Password.Root class="mb-3">
        <Password.Input
            id="password"
            name="password"
            required
            bind:value={password}
            onblur={validatePassword}
        >
            <Password.ToggleVisibility />
        </Password.Input>
        {#if option === "register"}
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
        {/if}
    </Password.Root>
{/snippet}

{#snippet formContent()}
    <form
        class="flex w-full flex-col"
        method="post"
        use:enhance
        action="?/{option === 'register' ? 'signup' : 'signin'}"
    >
        {#if option === "register"}
            <Label for="username">Nome utente</Label>
            <Input
                id="username"
                name="username"
                bind:value={username}
                required
                class="mb-3"
            />
            <Password.Helper enabled={usernameValidator} color="red">
                Solo lettere, numeri, underscore e spazi
            </Password.Helper>
        {/if}

        <Label for="email"
            >{option === "register" ? "Email" : "Email o nome utente"}</Label
        >
        <Input id="email" name="email" bind:value={email} required class="mb-3" />

        {@render passwordField()}

        {#if option === "register"}
            <Label for="password_repeat">Conferma Password</Label>
            <Password.Root class="mb-3">
                <Password.Input
                    id="password_repeat"
                    name="password_repeat"
                    required
                    bind:value={repeatPassword}
                    onblur={() =>
                        (validatorError = !(password === repeatPassword))}
                >
                    <Password.ToggleVisibility />
                </Password.Input>
                <Password.Helper enabled={validatorError}>
                    Le password non corrispondono
                </Password.Helper>
            </Password.Root>
        {/if}

        <a
            class="mt-1 w-max self-end p-0 text-sm hover:text-chart-2"
            href="/login/password-reset"
        >
            Password dimenticata?
        </a>

        <Button class="mt-3 w-full" type="submit">
            {option === "register" ? "Registrati" : "Accedi"}
        </Button>
    </form>
{/snippet}

<section
    class="flex w-full flex-grow flex-col items-center justify-start px-5 pt-10 text-xl"
>
    <Card.Root class="w-full max-w-96">
        <Card.Content>
            <Tabs.Root bind:value={option}>
                <Tabs.List class="w-full">
                    <Tabs.Trigger value="login">Accedi</Tabs.Trigger>
                    <Tabs.Trigger value="register">Registrati</Tabs.Trigger>
                </Tabs.List>

                <Card.Root class="w-60 my-2 py-2 self-center">
                    <a
                        class="flex items-center justify-center gap-2"
                        href="/api/auth/google"
                        role="button"
                    >
                        <img class="w-8" alt="G" src="/google.svg" />
                        <span>Login con Google</span>
                    </a>
                </Card.Root>
                <Separator class="mb-4" />

                {#if option === "login"}
                    <Tabs.Content value="login">
                        {@render formContent()}
                    </Tabs.Content>
                {/if}

                {#if option === "register"}
                    <Tabs.Content value="register">
                        {@render formContent()}
                    </Tabs.Content>
                {/if}
            </Tabs.Root>
        </Card.Content>
    </Card.Root>
</section>
