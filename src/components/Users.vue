<template>
  <div id="users">
    <h1> Manage Users </h1>

    <b-container>
      <div v-if="loading">
          <Flask />
          <p class="mt-3 pt-3 lead">loading...</p>
        </div>
      <div v-else class="user-div">
        <table id="user-table">
          <tr>
            <th>User</th>
            <th>isAdmin</th>
            <th>Score</th>
            <th>Datasets</th>
          </tr>
          <tr v-for="(value, name) in usersObject" :key="name" v-if="value.taken_tutorial">
            <td>{{ name }}</td>
            <td>{{ value.admin }}</td>
            <td>{{ value.score }}</td>
            <td><b-button variant="dark">{{ value.datasets }}</b-button></td>
          </tr>
        </table>
      </div>

    </b-container>

  </div>

</template>

<style>
.user-div {
  padding-bottom: 15vh;
}
table {
  margin: auto;
}
tr:nth-child(even) {
  background-color: #D6EEEE;
}
th {
  font-weight: 800;
  width: 120px;
}
</style>

<script>
import Flask from './Animations/Flask';

/** Admin panel for the /admin route.
 * The admin panel syncs data from `config.manifestUrl`. Only people
 * that are authorized can see this page. Authorization comes from
 * /user/<username>/admin and from /settings/admins/<username>. Both need to be
 * true to see this page.
 */
export default {
  name: 'users',
  data() {
    return {
      /**
       * The loading status
       */
      status: 'loading...',
      /**
       * Progress bar for the entries being synced to firebase
       */
      progress: 0,
      /**
       * The list of items to put into /sampleCounts
       */
      manifestEntries: [],
      /**
       * the /sampleCounts document from Firebase.
       */
      sampleCounts: [],
      /**
       * list of users in Firebase
       */
      usersObject: {
        // TestUser: {
        //   admin: false,
        //   consent: true,
        //   level: 1,
        //   score: 100,
        //   taken_tutorial: true,
        // },
      },
      loading: true,
    };
  },
  props: {
    /**
     * the intialized firebase database
     */
    db: {
      type: Object,
      required: true,
    },
  },
  async created() {
    await this.loadUsers();
  },
  components: {
    Flask,
  },
  methods: {
    /**
     * Loads the users from Firebase
     */
    async loadUsers() {
      console.log(this.usersObject);
      this.db.ref('/users').on('value', (snap) => {
        snap.forEach((element) => {
          this.usersObject[element.key] = element.val();
        });
        this.loading = false;
      });
    },
  },
};
</script>