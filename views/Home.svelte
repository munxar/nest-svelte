<script>
  import { log } from 'console';
import Layout from './Layout.svelte';
  export let message;  
</script>

<svelte:head>
  <title>Home</title>
</svelte:head>

<Layout>
  <h1>{message}</h1>    
</Layout>

<style>
  h1 {
    color: purple;
  }  
</style>