<template>
  <div id="admin">
    <h1> Admin </h1>

    <b-container>
      <p class="buttons mt-3">
        <router-link class="btn btn-warning" :to="{name: 'Users'}"> Manage Users </router-link>
        <router-link class="btn btn-warning" :to="{name: 'Manifest'}">Manage Database</router-link>
      </p>
      <hr>
      <div id=maintenance>
        <h1 for="maintenance-datepicker">Choose a date to display in maintenance banner</h1>
        <b-form-datepicker id="maintenance-datepicker" v-model="tempMaintenanceDate"></b-form-datepicker>
        <p>Chosen Date: {{tempMaintenanceDate}}</p>
        <b-button class="btn btn-warning" @click="changeBannerState">Banner is currently {{isBannerOn}}</b-button>
      </div>
    </b-container>

  </div>

</template>

<style>
  #maintenance p, #maintenance h1{
    margin: 0.3em;
  }
</style>

<script>

/** Admin panel for the /admin route.
 * Links to other admin only routes. Only people
 * that are authorized can see this page. Authorization comes from
 * /user/<username>/admin
 */
export default {
  name: 'admin',
  data() {
    return {
      tempMaintenanceDate: '',
      isBannerOn: '',
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
  },
  props: {
    maintenanceDate: {
      type: String,
      required: true,
    },
    maintenanceStatus: {
      type: Boolean,
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
  },
};
</script>
