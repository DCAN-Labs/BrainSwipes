<template>
  <div id="users">
    <h1> Manage Users </h1>
    <b-modal id="modifyuser" :title="`Modifying permissions for ${userModified.name}`"
      ref="modifyuser" size="lg">
      <div>
        <table>
          <tr>
            <th>Admin</th>
            <th v-for="study in Object.keys(studies)" :key="study">{{study}}</th>
          </tr>
          <tr>
            <td>
              <b-button variant="warning" @click="changeAdmin(userModified.admin)">{{userModified.admin}}</b-button>
            </td>
            <td v-for="(value, dataset) in userModified.datasets" :key="dataset">
              <b-button variant="danger" @click="changeDatasetAccess(dataset, userModified.datasets[dataset])">{{value}}</b-button>
            </td>
          </tr>
        </table>
        <br>
        <div id="organizations">
          <h2>Associated Organization</h2>
          <b-dropdown id="orgdropdown" :text="userModified.org" class="m-md-2">
            <b-dropdown-item v-for="org in globusAllowedOrgs" :key="org" @click="changeOrg(org)">{{org}}</b-dropdown-item>
          </b-dropdown>
        </div>
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
            <th>Admin</th>
            <th>Datasets</th>
          </tr>
          <tr v-for="user in Object.keys(userList).sort((a, b) => { return (b > a)? -1 : 1 })" :key="user">
            <td><b-button variant="outline-dark" @click="modifyUser(user, userList[user])">{{user}}</b-button></td>
            <td>{{ userList[user].admin }}</td>
            <td>
              <table>
                <tr>
                  <th v-for="study in Object.keys(studies)" :key="study" :class="{ red: userList[user].datasets? !userList[user].datasets[study] : false, green: userList[user].datasets? userList[user].datasets[study] : false }">{{study}}</th>
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
import firebase from 'firebase/app';
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
      userList: {},
      /**
       * Whether the user list is loading
       */
      loading: true,
      /**
       * Name of the user being modified
       */
      userModified: {
        name: '',
        admin: '',
        datasets: {},
        org: '',
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
      type: Object,
      required: true,
    },
    /**
     * List of trusted organizations from globus auth
     */
    globusAllowedOrgs: {
      type: Array,
      required: true,
    },
  },
  async created() {
    await this.getAllUserRoles();
  },
  components: {
    Flask,
  },
  methods: {
    /**
     * Populates the userModified data element
     * Opens the modify user dialog
     */
    modifyUser(user, value) {
      const valueCopy = JSON.parse(JSON.stringify(value));
      this.userModified.name = user;
      this.userModified.admin = valueCopy.admin;
      this.userModified.datasets = valueCopy.datasets;
      this.userModified.org = valueCopy.org;
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
     * Closes the modify user dialog and update the user's custom claims
     */
    closeDialogSubmit(e) {
      e.preventDefault();
      const obj = JSON.parse(JSON.stringify(this.userModified));
      this.$refs.modifyuser.hide();
      this.setUserRoles(obj).then(() => {
        this.$emit('changePermissions');
      });
    },
    /**
     * Switches the user's admin status
     * Does not modify the database until submitted
     */
    changeAdmin(value) {
      if (value) {
        this.userModified.admin = false;
      } else {
        this.userModified.admin = true;
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
     * Switches the user's globus auth organization
     */
    changeOrg(value) {
      this.userModified.org = value;
    },
    /**
     * Posts the user roles to the server
     */
    requestUserRolesUpdate(obj) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/setRoles', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = resolve;
        xhr.onerror = reject;
        xhr.send(JSON.stringify({
          obj,
          currentUser: firebase.auth().currentUser.uid,
        }));
      });
    },
    async setUserRoles(obj) {
      const userRoles = await this.requestUserRolesUpdate(obj).then(data =>
        JSON.parse(data.currentTarget.responseText),
      );
      this.userList[userRoles.name] = {
        admin: userRoles.admin, datasets: userRoles.datasets, org: userRoles.org };
    },
    /**
     * gets user roles from the server
     */
    requestAllUserRoles() {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/getAllUsers', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = resolve;
        xhr.onerror = reject;
        xhr.send(JSON.stringify({
          currentUser: firebase.auth().currentUser.uid,
        }));
      });
    },
    async getAllUserRoles() {
      const userList = await this.requestAllUserRoles().then(data =>
        JSON.parse(data.currentTarget.responseText),
      );
      this.userList = userList;
      this.loading = false;
    },
  },
};
</script>