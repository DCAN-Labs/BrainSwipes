<template>
  <div id="users">
    <h1> Manage Users </h1>

    <b-modal id="modifyuser" :title="userModified.name"
      ref="modifyuser" size="lg">
      <div>
        <b-button variant="warning" @click="changeAdmin(userModified.isAdmin)">isAdmin: {{userModified.isAdmin}}</b-button>
        <b-button variant="danger">datasets: {{userModified.datasets}}</b-button>
      </div>
      <div slot="modal-footer" class="w-100">
          <b-button @click="closeDialogSubmit" type="submit" variant="primary">Submit</b-button>
          <b-button @click="closeDialogCancel" type="submit" variant="primary">Cancel</b-button>
      </div>

    </b-modal>

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
            <td><b-button variant="outline-dark" @click="modifyUser(name, value)">{{ name }}</b-button></td>
            <td>{{ value.admin }}</td>
            <td>{{ value.score }}</td>
            <td>{{ value.datasets }}</td>
          </tr>
        </table>
      </div>

    </b-container>

  </div>

</template>

<style>
.user-div {
  padding-bottom: 10vh;
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
      usersObject: {},
      /**
       * Whether the user list is loading
       */
      loading: true,
      /**
       * Name of the user being modified
       */
      userModified: {
        name: '',
        isAdmin: '',
        datasets: [],
      },
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
      this.db.ref('/users').on('value', (snap) => {
        snap.forEach((element) => {
          this.usersObject[element.key] = element.val();
        });
        this.loading = false;
      });
    },
    modifyUser(name, value) {
      this.userModified.name = name;
      this.userModified.isAdmin = value.admin;
      this.userModified.datasets = value.datasets;
      this.$refs.modifyuser.show();
    },
    closeDialogCancel(e) {
      e.preventDefault();
      this.$refs.modifyuser.hide();
    },
    closeDialogSubmit(e) {
      e.preventDefault();
      this.$refs.modifyuser.hide();
    },
    changeAdmin(value) {
      if (value) {
        this.userModified.isAdmin = false;
      } else {
        this.userModified.isAdmin = true;
      }
    },
  },
};
</script>