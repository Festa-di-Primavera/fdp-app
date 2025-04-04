<script lang="ts">
    import { Button, Card, Helper, Input, Label } from "flowbite-svelte";
    import { XCircle } from "lucide-svelte";

    import { enhance } from "$app/forms";
    import FeedbackToast from "$components/feedbacks/FeedbackToast.svelte";
    import InputErrors from "$components/form/InputErrors.svelte";
    import PasswordEye from "$components/form/PasswordEye.svelte";
    import { user } from "$store/store";

    $user = null;
    let option: "login" | "register" = $state("login");

    let username: string = $state("");
    let email: string = $state("");
    let password: string = $state("");
    let repeatPassword: string = $state("");
    let pwVisible: boolean = $state(false);

    let feedbackToastOpen: boolean = $state(false);
    let color: "green" | "red" | "yellow" = $state("green");
    let timeOut: NodeJS.Timeout;
    let toastMessage: string = $state("");

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
                color = "red";
                toastMessage = form.message;
                feedbackToastOpen = true;
                timeOut = setTimeout(() => {
                    feedbackToastOpen = false;
                    clearTimeout(timeOut);
                }, 3500);
            } else {
                color = "green";
                toastMessage = form.message;
                feedbackToastOpen = true;
                timeOut = setTimeout(() => {
                    feedbackToastOpen = false;
                    clearTimeout(timeOut);
                }, 3500);
            }
        }
    });

    let validatorError: boolean = $state(true);
    let lessThanEightChars = $state(false);
    let noUpperCase = $state(false);
    let noNumber = $state(false);
    let noSpecialChar = $state(false);
    let usernameValidator: boolean = $state(false);

    $effect(() => {
        if (validatorError) {
            validatorError = !(password === repeatPassword);
        }

        if (option === "register") {
            if (lessThanEightChars) lessThanEightChars = password.length < 8;

            if (noUpperCase) noUpperCase = !/[A-Z]/.test(password);

            if (noNumber) noNumber = !/[0-9]/.test(password);

            if (noSpecialChar)
                noSpecialChar = !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(
                    password
                );
        }

        if (option === "register") {
            usernameValidator = !/^[a-zA-Z0-9_\ ]*$/.test(username);
        }
    });

    let disableButton = $state(false);
    let ToastIcon = $state(XCircle);
</script>

<section
    class="flex w-full flex-grow flex-col items-center justify-start px-5 py-10 text-xl text-black dark:text-white"
>
    <Card class="flex w-full max-w-96 flex-col items-center justify-center dark:bg-neutral-900 dark:border-neutral-700 dark:divide-neutral-500">
        <div class="mb-5 flex w-full justify-around dark:text-neutral-400">
            <button
                onclick={() => (option = "login")}
                class="w-[40%] border-b-2 {option == 'login'
                    ? 'border-primary-500 text-black dark:text-white'
                    : 'border-transparent'} pb-3">Login</button
            >
            <button
                onclick={() => (option = "register")}
                class="w-[40%] border-b-2 {option == 'register'
                    ? 'border-primary-500 text-black dark:text-white'
                    : 'border-transparent'} pb-3">Registrati</button
            >
        </div>

        <Card padding="none" class="mb-5 w-60 dark:bg-neutral-800 dark:text-neutral-400">
            <a
                class="flex items-center justify-center gap-2 px-4 py-2"
                href="/api/auth/google"
                role="button"
            >
                <img class="w-8" alt="G" src="/google.svg" />
                <span>Login con Google</span>
            </a>
        </Card>
        <div class="mb-5 w-full border-b-2"></div>
        <form
            class="flex w-full flex-col gap-3"
            method="post"
            use:enhance
            action="?/{option === 'login' ? 'signin' : 'signup'}"
        >
            <h1 class="w-max text-3xl font-semibold text-primary-600">
                {option === "login"
                    ? "Accedi"
                    : option === "register"
                      ? "Registrati"
                      : "Recupera password"}
            </h1>

            {#if option === "register"}
                <Label>
                    Nome utente
                    <Input name="username" bind:value={username} required class="mt-2 dark:bg-neutral-700 dark:border-neutral-500" />

                    {#if usernameValidator}
                        <Helper
                            class="mt-1 flex items-center gap-1"
                            color="gray"
                        >
                            <XCircle class="h-3 w-3" />
                            Il nome utente non deve contenere spazi o caratteri speciali
                        </Helper>
                    {/if}
                </Label>
            {/if}

            <Label>
                Email {#if option === "login"}o nome utente{/if}
                <Input name="email" bind:value={email} required class="mt-2 dark:bg-neutral-700 dark:border-neutral-500" />
            </Label>

            <Label>
                Password
                <Input
                    id="password"
                    name="password"
                    type={pwVisible ? "text" : "password"}
                    required
                    bind:value={password}
                    onblur={() => {
                        lessThanEightChars = password.length < 8;
                        noUpperCase = !/[A-Z]/.test(password);
                        noNumber = !/[0-9]/.test(password);
                        noSpecialChar =
                            !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(
                                password
                            );
                    }}
                    class="mt-2 dark:bg-neutral-700 dark:border-neutral-500"
                >
                    <PasswordEye bind:pwVisible slot="right" />
                </Input>
                <InputErrors
                    bind:lessThanEightChars
                    bind:noUpperCase
                    bind:noNumber
                    bind:noSpecialChar
                    bind:option
                />
            </Label>

            {#if option === "register"}
                <Label>
                    Conferma password
                    <Input
                        name="password_repeat"
                        type={pwVisible ? "text" : "password"}
                        color={!validatorError ? "base" : "red"}
                        bind:value={repeatPassword}
                        required
                        onblur={() =>
                            (validatorError = !(password === repeatPassword))}
                        class="mt-2 dark:bg-neutral-700 dark:border-neutral-500"
                    >
                        <PasswordEye bind:pwVisible slot="right" />
                    </Input>
                    {#if validatorError}
                        <Helper
                            class="mt-1 flex items-center gap-1"
                            color="gray"
                        >
                            <XCircle class="h-3 w-3" />
                            Le password non corrispondono
                        </Helper>
                    {/if}
                </Label>
            {/if}

            <a
                class="mt-1 w-max self-end p-0 text-sm hover:text-primary-500 dark:text-neutral-300"
                href="/login/password-reset">Password dimenticata?</a
            >
            <Button
                class="mt-3 w-full"
                type="submit"
                bind:disabled={disableButton}
            >
                {option === "login" ? "Accedi" : "Registrati"}
            </Button>
        </form>
    </Card>
</section>

<FeedbackToast
    bind:open={feedbackToastOpen}
    bind:color
    bind:message={toastMessage}
    bind:ToastIcon
/>
