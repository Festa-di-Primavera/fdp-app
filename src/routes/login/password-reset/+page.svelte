<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button/index";
    import { Input } from "$lib/components/ui/input/index";
    import { Label } from "$lib/components/ui/label/index";
    import { toast } from "svelte-sonner";

    let { form } = $props();
    $effect(() => {
        if (form && form.error) {
            toast.error(form.message);
        }
    });
</script>

<section class="w-full h-full flex flex-col items-center gap-4 flex-grow">
    <div
        class="w-full px-5 pt-5 flex flex-col gap-4 items-start max-w-96 pb-12 flex-grow"
    >
        <h1 class="text-app-accent font-bold text-4xl">Reset Password</h1>
        <p class="text-justify">
            Inserisci la mail a cui deve essere inviato il link per il reset
            della password
        </p>
        <form
            use:enhance
            method="post"
            action="?/passwordResetRequest"
            class="w-full flex flex-col items-center gap-3"
        >
            <div class="w-full">
                <Label for="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    autocomplete="off"
                    placeholder="example@email.com"
                />
            </div>

            <Button type="submit" class="mt-5 w-[90%]">Invia email</Button>
        </form>
    </div>
</section>
