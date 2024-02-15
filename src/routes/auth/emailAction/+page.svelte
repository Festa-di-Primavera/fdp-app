<script lang="ts">
	import EmailVerify from '../../../components/emailActions/EmailVerify.svelte';
	import PasswordReset from '../../../components/emailActions/PasswordReset.svelte';
	import type { ActionData } from '../../../models/email_action_data';

	export let data: ActionData;
</script>

<section class="flex h-full w-full flex-grow flex-col items-center gap-4">
	<div class="flex w-full flex-grow flex-col items-start gap-4 px-5 pb-12 pt-5">
		{#if data.mode === 'verifyEmail'}
			<EmailVerify {data} />
		{:else if data.mode === 'resetPassword'}
			<PasswordReset {data} />
		{/if}
	</div>
</section>
