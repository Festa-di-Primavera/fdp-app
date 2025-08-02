import type {
	WithChildren,
	WithoutChildren,
	Toggle as TogglePrimitive
} from 'bits-ui';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';

export type PasswordRootPropsWithoutHTML = WithChildren<{
	ref?: HTMLDivElement | null;
	hidden?: boolean;
}>;

export type PasswordRootProps = WithoutChildren<HTMLAttributes<HTMLDivElement>> &
	PasswordRootPropsWithoutHTML;

export type PasswordInputPropsWithoutHTML = WithChildren<{
	ref?: HTMLInputElement | null;
	value?: string;
}>;

export type PasswordInputProps = Omit<
	WithoutChildren<HTMLInputAttributes>,
	'type' | 'files' | 'aria-invalid' | 'value'
> &
	PasswordInputPropsWithoutHTML;

export type PasswordToggleVisibilityProps = Omit<
	TogglePrimitive.RootProps,
	'children' | 'pressed' | 'aria-label' | 'tabindex'
>;

export type PasswordHelperPropsWithoutHTML = WithChildren<{
	enabled?: boolean;
	color?: 'gray' | 'red' | 'green';
	icon?: boolean;
}>;

export type PasswordHelperProps = WithoutChildren<HTMLAttributes<HTMLDivElement>> &
	PasswordHelperPropsWithoutHTML;
