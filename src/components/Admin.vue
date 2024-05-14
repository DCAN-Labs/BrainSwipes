<template>
  <div id="admin">
    <h1> Admin </h1>

    <b-container class="admin">
      <p class="buttons mt-3">
        <router-link class="btn btn-warning" :to="{name: 'Users'}"> Manage Users </router-link>
        <router-link class="btn btn-warning" :to="{name: 'Visualization'}"> View Study Visualizations </router-link>
        <router-link class="btn btn-warning" :to="{name: 'AccessReview'}"> Review Access Requests </router-link>
        <router-link class="btn btn-warning" :to="{name: 'CatchTrials'}"> View Catch Trials </router-link>
        <router-link class="btn btn-warning" :to="{name: 'SampleView'}"> View Specific Samples </router-link>
        <router-link class="btn btn-warning" v-if="fullAdmin" :to="{name: 'Manifest'}">Manage Database</router-link>
      </p>
      <hr>
      <p>See the BrainSwipes <a href="https://brainswipes.readthedocs.io/" target="blank">readthedocs</a> for information on administration of BrainSwipes.</p>
    </b-container>

  </div>

</template>

<style scoped>
  .buttons {
    display: flex;
    flex-direction: column;
  }
  .btn {
    margin: 5px;
  }
  .admin {
    max-width: 500px;
  }
</style>

<script>

/** Admin panel for the /admin route.
 * Links to other admin only routes. Only people
 * that are authorized can see this page. Authorization comes from
 * /user/<username>/admin
 */
import firebase from 'firebase/app';
import 'firebase/auth';

export default {
  name: 'admin',
  data() {
    return {
      /**
       * whether they are full admin or just a dataset admin
       */
      fullAdmin: false,
    };
  },
  methods: {
    async getUserRoles() {
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const userRoles = idTokenResult.claims;
      this.fullAdmin = userRoles.admin;
    },
  },
  mounted() {
    this.getUserRoles();
  },
};
</script>
