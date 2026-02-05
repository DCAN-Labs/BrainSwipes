<template>
  <div id="users">
    <h1> Manage Users </h1>
    <b-modal id="modifyuser" v-if="!loading" :title="`Modifying permissions for ${userModified.name} | ${userModified.email}`"
      ref="modifyuser" size="lg">
      <div>
        <div id="brainswipes-admin">
          <h2>Admin Level</h2>
          <div class="admin-buttons">
            <div v-if="userList[userData.username].admin">
              <h3>BrainSwipes Admin</h3>
              <b-button variant="warning" @click="changeAdmin(userModified.admin)">{{userModified.admin}}</b-button>
            </div>
            <div>
              <h3>Study Admin</h3>
              <div id="study-admin-list">
                <div v-for="(value, dataset) in userModified.studyAdmin" :key="dataset" v-show="userList[userData.username].studyAdmin[dataset] || userList[userData.username].admin">
                  <div v-if="userList[userData.username].studyAdmin[dataset] || userList[userData.username].admin">
                    <b-button :variant="value ? 'success' : 'outline-danger'" @click="changeStudyAdmin(dataset, value)">{{dataset}}</b-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr>
        <div id="study-access">
          <h2>Study Access</h2>
          <div id="study-access-list">
            <div v-for="(value, dataset) in userModified.datasets" :key="dataset" v-show="userList[userData.username].studyAdmin[dataset] || userList[userData.username].admin">
              <div v-if="userList[userData.username].studyAdmin[dataset] || userList[userData.username].admin">
                <b-button :variant="value ? 'success' : 'outline-danger'" @click="changeDatasetAccess(dataset, value)">{{dataset}}</b-button>
              </div>
            </div>
          </div>
        </div>
        <hr>
        <div id="organizations">
          <h2>Associated Organization</h2>
          <b-form-select :disabled="!userList[userData.username].admin" v-model="userModified.org" :options="globusOrgs"></b-form-select>
          <p v-if="!userList[userData.username].admin">Contact a BrainSwipes site-wide admin to change this</p>
          <p v-else>Open dropdown and type to search</p>
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
        <p>Users only appear here if they have completed the tutorial</p>
        <table id="user-table">
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Studies</th>
          </tr>
          <tr v-for="user in Object.keys(userList).sort((a, b) => { return (b > a)? -1 : 1 })" :key="user">
            <!-- Button Column-->
            <td><b-button variant="outline-dark" @click="modifyUser(user, userList[user])">{{user}}</b-button></td>
            <!-- e-mail Column -->
            <td class="userlist-cell">{{userList[user].email}}</td>
            <!-- Admin Column -->
            <!-- Check for admin information in userData -  -->
            <td v-if="userList[user].admin" class="userlist-cell">
              BrainSwipes
            </td>
            <!-- Check for Study admin information -->
            <td v-else-if="!userList[user].studyAdmin" class="userlist-cell" style="color: #990000;">
              No Admin Data
            </td>
            <td v-else-if="userList[user].studyAdmin && Object.values(userList[user].studyAdmin).includes(true)" class="userlist-cell">
              Study
            </td>
            <td v-else class="userlist-cell" >
            </td>
            <!-- Study Column -->
            <td>
              <table class="studiesTable">
                <tr>
                  <th v-for="study in Object.keys(config.studies)" :key="study" v-show="userList[userData.username].studyAdmin[study] || userList[userData.username].admin" :class="{ red: userList[user].datasets? !userList[user].datasets[study] : false, green: userList[user].datasets? userList[user].datasets[study] : false }">{{study}}</th>
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
.userlist-cell {
  border-right: 1px solid black;
}
.red {
  background-color: red;
}
.green {
  background-color: green;
}
.studiesTable th{
  border: 2px solid black;
}
.admin-buttons{
  display: flex;
  justify-content: space-around;
}
#study-access-list, #study-admin-list{
  display: flex;
  justify-content: space-around;
}
.dropdown-menu {
  overflow: auto;
  max-height: 80vh;
}
</style>

<script>
import firebase from 'firebase/app';
import _ from 'lodash';
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
       * list of users in Firebase auth
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
        studyAdmin: {},
      },
    };
  },
  props: {
    /**
     * the initialized firebase database
     */
    db: {
      type: Object,
      required: true,
    },
    /**
     * config from the db
     */
    config: {
      type: Object,
      required: true,
    },
    /**
     * it comes directly from the `/users` document in Firebase.
     */
    allUsers: {
      type: Object,
      required: true,
    },
    userData: {
      type: Object,
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
      this.userModified.studyAdmin = valueCopy.studyAdmin;
      this.userModified.email = valueCopy.email;
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
     * Adds or removes study specific admin status
     */
    changeStudyAdmin(study, value) {
      if (value) {
        this.userModified.studyAdmin[study] = false;
      } else {
        this.userModified.studyAdmin[study] = true;
      }
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
        admin: userRoles.admin,
        datasets: userRoles.datasets,
        org: userRoles.org,
        studyAdmin: userRoles.studyAdmin,
        email: userRoles.email };
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
      // Get object with all user information
      const authUserList = await this.requestAllUserRoles().then(data =>
        JSON.parse(data.currentTarget.responseText),
      );
      // Create array using authUserList only selecting users with completed tutorials
      const filteredUserList = _.pick(
        authUserList,
        Object.keys(
          _.pickBy(this.allUsers, (user) => {
            // Initialize variable to exclude user by default
            let includeUser = false;
            // Include user if the tutorial attribute exists and is set to 'complete'
            if (Object.hasOwn(user, 'tutorials')) {
              includeUser = user.tutorials.basic === 'complete';
            }
            // Return value to include user or not
            return includeUser;
          }),
        ));
      // console.log('filteredUserList:', filteredUserList);
      // console.log('userList:', this.userList);
      // Set values for UI use
      this.userList = filteredUserList;
      this.loading = false;
    },
  },
  computed: {
    globusOrgs() {
      const globusOrgs = [];
      this.config.allowedGlobusOrganizations.forEach((org) => {
        globusOrgs.push({ value: org, text: org });
      });
      return globusOrgs;
    },
  },
};
</script>