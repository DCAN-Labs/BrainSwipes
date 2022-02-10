<template>
  <div id="users">
    <h1> Manage Users </h1>
    <b-modal id="modifyuser" :title="`Modifying permissions for ${userModified.name}`"
      ref="modifyuser" size="lg">
      <div>
        <table>
          <tr>
            <th>isAdmin</th>
            <th v-for="study in studies" :key="study">{{study}}</th>
          </tr>
          <tr>
            <td>
              <b-button variant="warning" @click="changeAdmin(userModified.isAdmin)">{{userModified.isAdmin}}</b-button>
            </td>
            <td v-for="(value, dataset) in userModified.datasets" :key="dataset">
              <b-button variant="danger" @click="changeDatasetAccess(dataset, userModified.datasets[dataset])">{{value}}</b-button>
            </td>
          </tr>
        </table>
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
            <td>
              <table>
                <tr>
                  <th v-for="study in studies" :key="study" v-bind:class="{red: !value.datasets[study], green: value.datasets[study]}">{{study}}</th>
                </tr>
              </table>
            </td>
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
#user-table button{
  width: 100%;
}
.user-div tr:nth-child(even) {
  background-color: #D6EEEE;
}
th {
  font-weight: 800;
  width: 120px;
}
.red {
  background-color: red;
}
.green {
  background-color: green;
}
</style>

<script>
import Flask from './Animations/Flask';

/** User Management panel for the /user route.
 * The user panel changes user's access. Only people
 * that are authorized can see this page. Authorization comes from
 * /user/<username>/admin
 */
export default {
  name: 'users',
  data() {
    return {
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
        datasets: {},
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
    /**
     * list of studies from the db
     */
    studies: {
      type: Array,
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
    /**
     * Populates the userModified data element
     * Opens the modify user dialog
     */
    modifyUser(name, value) {
      const valueCopy = JSON.parse(JSON.stringify(value));
      this.userModified.name = name;
      this.userModified.isAdmin = valueCopy.admin;
      this.userModified.datasets = valueCopy.datasets;
      this.$refs.modifyuser.show();
    },
    /**
     * Closes the modify user dialog without updating
     */
    closeDialogCancel(e) {
      e.preventDefault();
      this.$refs.modifyuser.hide();
    },
    /**
     * Closes the modify user dialog and calls updateFirebase
     */
    closeDialogSubmit(e) {
      e.preventDefault();
      const obj = JSON.parse(JSON.stringify(this.userModified));
      this.$refs.modifyuser.hide();
      this.updateFirebase(obj);
      this.$emit('changePermissions', obj.datasets);
      this.loading = true;
      this.loadUsers();
    },
    /**
     * Switches the user's admin status
     * Does not modify the database until submitted
     */
    changeAdmin(value) {
      if (value) {
        this.userModified.isAdmin = false;
      } else {
        this.userModified.isAdmin = true;
      }
    },
    /**
     * Switches the user's dataset access
     * Does not modify the database until submitted
     */
    changeDatasetAccess(dataset, value) {
      if (value) {
        this.userModified.datasets[dataset] = false;
      } else {
        this.userModified.datasets[dataset] = true;
      }
    },
    /**
     * Modifies the database with the prepared user data
     */
    updateFirebase(obj) {
      const user = obj.name;
      const admin = obj.isAdmin;
      const datasets = obj.datasets;
      const updates = {};
      updates[`/users/${user}/datasets`] = datasets;
      updates[`/users/${user}/admin`] = admin;
      this.db.ref().update(updates);
    },
  },
};
</script>