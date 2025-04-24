<template>
  <div class="contact-us">
    <!-- Preferred Contact Method Notice -->
    <section class="form-section">
      <h2>We prefer that you use the form below to contact us:</h2>
      <b-button
        href="https://docs.google.com/forms/d/1dirzf9j-0s3hBNoEetuvOWAzr8MHkBs3Hexia4BdHOU/edit"
        target="_blank"
        variant="primary"
        class="mb-4"
      >
        Fill Out Contact Form
      </b-button>
    </section>

    <hr class="section-divider" />

    <!-- Email Contact Section -->
    <section class="form-section">
      <h2>Alternatively, you can send us an email</h2>
      <b-form @submit.prevent="submitForm">
        <b-form-group label="Your Email" label-for="emailInput">
          <b-form-input
            id="emailInput"
            type="email"
            v-model="email"
            :readonly="true"
          />
        </b-form-group>

        <b-form-group label="Subject" label-for="subjectInput">
          <b-form-input
            id="subjectInput"
            v-model="subject"
            required
          />
        </b-form-group>

        <b-form-group label="Message" label-for="bodyInput">
          <b-form-textarea
            id="bodyInput"
            v-model="body"
            rows="5"
            required
          />
        </b-form-group>

        <b-button type="submit" variant="secondary">
          Send Email
        </b-button>
      </b-form>
    </section>
  </div>
</template>

<script>
export default {
  name: 'ContactUs',
  data() {
    return {
      email: '',
      subject: '',
      body: '',
    };
  },
  created() {
    if (this.$root?.$data?.user?.email) {
      this.email = this.$root.$data.user.email;
    }
  },
  methods: {
    submitForm() {
      const mailtoLink = `mailto:testbrainswipes@umn.edu?subject=${encodeURIComponent(this.subject)}&body=${encodeURIComponent(this.body + '\n\nFrom: ' + this.email)}`;
      window.location.href = mailtoLink;
    },
  },
};
</script>

<style scoped>
.contact-us {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}
.section-divider {
  margin: 2rem 0;
  border-top: 1px solid #ccc;
}
.form-section h2 {
  margin-bottom: 1rem;
}
</style>
