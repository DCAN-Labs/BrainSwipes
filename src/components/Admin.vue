<template>
  <div id="admin">
    <h1> Admin </h1>

    <b-container class="admin">
      <p class="buttons mt-3">
        <router-link class="btn btn-warning" :to="{name: 'Users'}"> Manage Users </router-link>
        <router-link class="btn btn-warning" v-if="fullAdmin" :to="{name: 'Manifest'}">Manage Database</router-link>
        <router-link class="btn btn-warning" :to="{name: 'Visualization'}"> View Study Visualizations </router-link>
        <router-link class="btn btn-warning" :to="{name: 'AccessReview'}"> Review Access Requests </router-link>
        <router-link class="btn btn-warning" :to="{name: 'SampleView'}"> View Specific Samples </router-link>
      </p>
      <hr>
      <div id=maintenance v-if="fullAdmin">
        <h1 for="maintenance-datepicker">Choose a date to display in maintenance banner</h1>
        <b-form-datepicker id="maintenance-datepicker" v-model="tempMaintenanceDate"></b-form-datepicker>
        <p>Chosen Date: {{tempMaintenanceDate}}</p>
        <b-button class="btn btn-warning" @click="changeBannerState">Banner is currently {{isBannerOn}}</b-button>
      </div>
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
       * vars for setting the maintenance banner
       */
      tempMaintenanceDate: '',
      isBannerOn: '',
      /**
       * whether they are full admin or just a dataset admin
       */
      fullAdmin: false,
    };
  },
  methods: {
    changeBannerState() {
      let update;
      if (this.isBannerOn === 'ON') {
        this.isBannerOn = 'OFF';
        update = { '/config/maintenance/bannerStatus': false, '/config/maintenance/date': this.tempMaintenanceDate };
      } else {
        this.isBannerOn = 'ON';
        update = { '/config/maintenance/bannerStatus': true, '/config/maintenance/date': this.tempMaintenanceDate };
      }
      this.db.ref().update(update);
    },
    getMaintenanceDate() {
      this.tempMaintenanceDate = this.maintenanceDate;
    },
    getMaintenanceStatus() {
      if (this.maintenanceStatus) {
        this.isBannerOn = 'ON';
      } else {
        this.isBannerOn = 'OFF';
      }
    },
    async getUserRoles() {
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const userRoles = idTokenResult.claims;
      this.fullAdmin = userRoles.admin;
    },
  },
  props: {
    config: {
      type: Object,
      required: true,
    },
    db: {
      type: Object,
      required: true,
    },
  },
  mounted() {
    this.getMaintenanceDate();
    this.getMaintenanceStatus();
    this.getUserRoles();
  },
  calculated: {
    maintenanceDate() {
      return this.config.maintenance.date;
    },
    maintenanceStatus() {
      return this.config.maintenance.bannerStatus;
    },
  },
};
</script>
