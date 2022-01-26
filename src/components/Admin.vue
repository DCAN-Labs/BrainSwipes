<template>
  <div id="admin">
    <h1> Admin </h1>

    <b-container>
     <p class="buttons mt-3">
        <router-link class="btn btn-warning" :to="{name: 'Users', query: routerQuery}"> Manage Users </router-link>
        <router-link class="btn btn-warning" :to="{name: 'Manifest', query: routerQuery}">Manage Database</router-link>
      </p>

    </b-container>

  </div>

</template>

<style>

</style>

<script>

/** Admin panel for the /admin route.
 * The admin panel syncs data from the uploaded file. Only people
 * that are authorized can see this page. Authorization comes from
 * /user/<username>/admin
 */
export default {
  name: 'admin',
  data() {
    return {

    };
  },
  props: {

  },
};
</script>
