<template>
  <div id="access-review">
    <h1>Review Study Access Requests</h1>
    <div v-if="loading"></div>
    <div v-else class="requests-list">
      <div v-if="Object.keys(requests).length">
        <div v-for="study in Object.keys(requests)" :key="study">
          <h2>{{study}}</h2>
          <div v-if="Object.keys(requests[study]).length">
            <div v-for="request in Object.keys(requests[study])" :key="request" class="study-card-wrapper">
              <b-card v-if="requests[study][request].status === 'awaiting'">
                <b-form-group label="Study" label-for="selectStudy" label-cols="4">
                  <b-form-input id="selectStudy" readonly v-model="requests[study][request].study"></b-form-input>
                </b-form-group>
                <b-form-group label-cols="4" label="Full Name" label-for="name">
                  <b-form-input v-model="requests[study][request].name" readonly id="name"></b-form-input>
                </b-form-group>
                <b-form-group label-cols="4" label="Username" label-for="username">
                  <b-form-input id="username" readonly v-model="requests[study][request].username"></b-form-input>
                </b-form-group>
                <b-form-group label-cols="4" label="Email" label-for="email">
                  <b-form-input id="email" readonly v-model="requests[study][request].email"></b-form-input>
                </b-form-group>
                <b-form-group label-cols="4" label="Date Submitted" label-for="time">
                  <b-form-input id="time" readonly v-model="requests[study][request].time"></b-form-input>
                </b-form-group>
                <b-form-group label="Organization" label-for="selectGlobusOrg" label-cols="4" description="This should be the organization this user is a member of for purposes of this study's data use agreement. If it is not, deny the request.">
                  <b-form-input id="selectGlobusOrg" v-model="requests[study][request].org" readonly></b-form-input>
                </b-form-group>
                <hr>
                <div>
                  <b-button @click="acceptRequest(study, request, requests[study][request].org)" variant="success">Accept</b-button>
                  <b-button @click="denyRequest(study, request)" variant="danger" >Deny</b-button>
                </div>
                <div v-if="requests[study][request].status == 'pending-denial'">
                  <b-form-group label="Reason for denial of access">
                    <b-form-radio v-model="requests[study][request].reason" value="Not Eligible">Not eligible</b-form-radio>
                    <b-form-radio v-model="requests[study][request].reason" value="Other">Other</b-form-radio>
                  </b-form-group>
                  <b-form-group v-if="requests[study][request].reason == 'Other'" label="Additional Info" label-for="additional-info">
                    <b-form-input id="additional-info" v-model="requests[study][request].other"></b-form-input>
                  </b-form-group>
                  <b-button @click="confirmDeny(study, request)" variant="danger" :disabled="disableConfirmDeny(requests[study][request])">Confirm</b-button>
                </div>
              </b-card>
              <b-card v-else>
                <b-form-group label-cols="4" label="Full Name" label-for="name">
                  <b-form-input v-model="requests[study][request].name" readonly id="name"></b-form-input>
                </b-form-group>
                <b-alert show :variant="requests[study][request].status === 'denied' ? 'danger' : 'success'">
                  {{requests[study][request].status}}
                </b-alert>
              </b-card>
            </div>
          </div>
          <div v-else>
            <h3>No Requests to Review</h3>
          </div>
        </div>
      </div>
      <div v-else>
        <h2>No Requests to Review.</h2>
      </div>
    </div>
  </div>

</template>

<style scoped>
  .card{
    width: 500px;
  }
  .study-card-wrapper{
    display: flex;
    justify-content: center;
  }
  .requests-list{
    padding-bottom: 10vh;
  }
</style>

<script>

/**
 * Route for requesting access to a restricted dataset.
 */
import firebase from 'firebase/app';
import 'firebase/auth';
import _ from 'lodash';

export default {
  name: 'access-review',
  data() {
    return {
      /**
       * List of requests
       */
      requests: {},
      /**
       * is the data loading
       */
      loading: true,
    };
  },
  props: {
    /**
     * the authenticated user object from firebase
     */
    userInfo: {
      type: Object,
      required: true,
    },
    /**
     * the config document from firebase
     */
    config: {
      type: Object,
      required: true,
    },
    /**
     * the intialized firebase database
     */
    db: {
      type: Object,
      required: true,
    },
  },
  methods: {
    async getRequests() {
      const idTokenResult = await firebase.auth().currentUser.getIdTokenResult(true);
      const claims = idTokenResult.claims;
      this.db.ref('requests').once('value', (snap) => {
        const requests = snap.val();
        Object.keys(requests).forEach((study) => {
          Object.keys(requests[study]).forEach((user) => {
            if (requests[study][user].status === 'accepted' || requests[study][user].status === 'denied') {
              delete requests[study][user];
            } else {
              const time = new Date(requests[study][user].timestamp).toLocaleDateString();
              requests[study][user].time = time;
            }
          });
        });
        if (claims.admin) {
          this.requests = requests;
        } else {
          this.requests = _.pickBy(requests, (v, k) => claims.studyAdmin[k]);
        }
        this.loading = false;
      });
    },
    async acceptRequest(study, user, org) {
      this.requests[study][user].status = 'accepted';
      this.db.ref(`requests/${study}/${user}`).update({ status: 'accepted' });
      this.requestUserPermissionUpdate(study, user, org);
    },
    requestUserPermissionUpdate(study, user, org) {
      const obj = {
        name: user,
        datasets: { [study]: true },
        org,
      };
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
    denyRequest(study, user) {
      this.requests[study][user].status = 'pending-denial';
    },
    confirmDeny(study, user) {
      this.requests[study][user].status = 'denied';
      const update = {
        status: 'denied',
        reason: this.requests[study][user].reason,
      };
      if (update.reason === 'Other') {
        update.other = this.requests[study][user].other;
      }
      this.db.ref(`requests/${study}/${user}`).update(update);
    },
    disableConfirmDeny(request) {
      let disabled = true;
      if (Object.hasOwn(request, 'reason')) {
        if (request.reason === 'Other') {
          if (Object.hasOwn(request, 'other')) {
            disabled = request.other.length < 1;
          }
        } else {
          disabled = false;
        }
      }
      return disabled;
    },
  },
  mounted() {
    this.getRequests();
  },
};
</script>
