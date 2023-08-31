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
              <b-card v-if="requests[study][request].status === 'awaiting' || requests[study][request].status === 'pending-denial' || requests[study][request].status === 'pending-acceptance'">
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
                  <b-button @click="acceptRequest(study, request)" variant="success">Accept</b-button>
                  <b-button @click="denyRequest(study, request)" variant="danger" >Deny</b-button>
                </div>
                <div v-if="requests[study][request].status == 'pending-denial'">
                  <br>
                  <b-button @click="confirmDeny(study, request)" variant="danger">Confirm</b-button>
                </div>
                <div v-if="requests[study][request].status == 'pending-acceptance'">
                  <br>
                  <b-button @click="confirmAccept(study, request, requests[study][request].org)" variant="success">Confirm</b-button>
                </div>
              </b-card>
              <b-card v-else>
                <b-form-group label-cols="4" label="Full Name" label-for="name">
                  <b-form-input v-model="requests[study][request].name" readonly id="name"></b-form-input>
                </b-form-group>
                <b-alert show :variant="requests[study][request].status === 'denied' ? 'danger' : 'success'">
                  {{requests[study][request].status}}
                </b-alert>
                <a target="_blank" :href="mailto">Send Email</a>
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
    margin-bottom: 10px;
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
      /**
       * the current request's user's email
       */
      userEmail: '',
      /**
       * the current request's study
       */
      requestedStudy: '',
      /**
       * whether the request has been accepted
       */
      requestAccepted: false,
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
  computed: {
    /**
     * formats the email to send to a user after request is processed
     */
    mailto() {
      let mailto = '';
      if (this.requestAccepted === true) {
        mailto = `mailto:${this.userEmail}?subject=BrainSwipes access request approved&body=Your request to access ${this.requestedStudy} has been approved. Please visit https://brainswipes.us to begin swiping!`;
      } else {
        mailto = `mailto:${this.userEmail}?subject=BrainSwipes access request denied&body=Your request to access ${this.requestedStudy} has been denied. Please contact the study's administrator to be added to any required data contracts.`;
      }
      return mailto;
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
    acceptRequest(study, user) {
      this.userEmail = this.requests[study][user].email;
      this.requestedStudy = study;
      this.requestAccepted = true;
      this.requests[study][user].status = 'pending-acceptance';
    },
    async confirmAccept(study, user, org) {
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
      this.userEmail = this.requests[study][user].email;
      this.requestedStudy = study;
      this.requestAccepted = false;
      this.requests[study][user].status = 'pending-denial';
    },
    confirmDeny(study, user) {
      this.requests[study][user].status = 'denied';
      this.db.ref(`requests/${study}/${user}`).update({ status: 'denied' });
    },
  },
  mounted() {
    this.getRequests();
  },
};
</script>
