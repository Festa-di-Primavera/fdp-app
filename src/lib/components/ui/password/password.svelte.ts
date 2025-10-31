import { Context, watch } from "runed";
import type { ReadableBoxedValues, WritableBoxedValues } from "svelte-toolbelt";

type PasswordRootStateProps = WritableBoxedValues<{
    hidden: boolean;
}>;

type PasswordState = {
    value: string;
    toggleMounted: boolean;
    tainted: boolean;
};

const defaultPasswordState: PasswordState = {
    value: "",
    toggleMounted: false,
    tainted: false,
};

class PasswordRootState {
    passwordState = $state(defaultPasswordState);

    constructor(readonly opts: PasswordRootStateProps) {}
}

type PasswordInputStateProps = WritableBoxedValues<{
    value: string;
}> &
    ReadableBoxedValues<{
        ref: HTMLInputElement | null;
    }>;

class PasswordInputState {
    constructor(
        readonly root: PasswordRootState,
        readonly opts: PasswordInputStateProps
    ) {
        watch(
            () => this.opts.value.current,
            () => {
                if (this.root.passwordState.value !== this.opts.value.current) {
                    this.root.passwordState.value = this.opts.value.current;
                }
            }
        );
    }

    props = $derived.by(() => ({
        "aria-invalid": this.root.passwordState.tainted,
    }));
}

class PasswordToggleVisibilityState {
    constructor(readonly root: PasswordRootState) {
        this.root.passwordState.toggleMounted = true;

        // this way we go back to the correct padding when toggle is unmounted
        $effect(() => {
            return () => {
                this.root.passwordState.toggleMounted = false;
            };
        });
    }
}

const ctx = new Context<PasswordRootState>("password-root-state");

export function usePassword(props: PasswordRootStateProps) {
    return ctx.set(new PasswordRootState(props));
}

export function usePasswordInput(props: PasswordInputStateProps) {
    return new PasswordInputState(ctx.get(), props);
}

export function usePasswordToggleVisibility() {
    return new PasswordToggleVisibilityState(ctx.get());
}
