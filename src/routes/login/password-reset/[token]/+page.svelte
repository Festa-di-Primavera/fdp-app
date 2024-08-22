<!-- /routes/login/password/[token] -->

<!-- display token -->
<script lang="ts">
	import { page } from "$app/stores";

	let token = $page.params.token;
</script>

 <p>
	Token: {token}
 </p>