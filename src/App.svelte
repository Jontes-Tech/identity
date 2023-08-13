<script>
  import Main from "./Main.svelte";
  const path = window.location.pathname;
</script>
{#if path === "/"}
<Main/>
{/if}