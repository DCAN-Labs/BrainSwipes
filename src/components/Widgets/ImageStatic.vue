<template>
  <div class="imageStatic">
    <div class="user-card">
      <div class="image_area">
        <img class="user-card__picture mx-auto"
          :src="imgUrl"
          @error="imageError"
        >
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ImageStatic',
    props: {
      /**
       * The sample ID to tell the widget to display.
       */
      widgetPointer: {
        type: String,
        required: true,
      },
      /**
       * the dataset to swipe on
       */
      dataset: {
        type: String,
        required: true,
      },
      /**
       * The config from firebase.
       * Includes information necessary to access the correct image
       */
      config: {
        type: Object,
        required: true,
      },
    },
    data() {
      return {
        /**
         * the status of the image to load
         */
        status: 'loading',
        /**
         * save the swipe direction.
         */
        imgUrl: null,
        imgKey: null,
      };
    },
    async created() {
      await this.createUrl(this.widgetPointer);
      this.lastClick = Date.now();
    },
    methods: {
      postRequest(pointer) {
        const bucket = this.config.datasets[this.dataset].bucket;
        let filepath = `${pointer}.png`;
        if (Object.hasOwn(this.config.datasets[this.dataset], 's3filepath')) {
          const s3filepath = this.config.datasets[this.dataset].s3filepath;
          const subRegExp = /(sub-.*?)_/;
          const sesRegExp = /_(ses-.*?)_/;
          const sesMatch = pointer.match(sesRegExp);
          const subMatch = pointer.match(subRegExp);
          let ses = '';
          let sub = '';
          if (sesMatch) {
            ses = pointer.match(sesRegExp)[1];
          }
          if (subMatch) {
            sub = pointer.match(subRegExp)[1];
          }
          filepath = s3filepath.replaceAll('{{SUBJECT}}', sub).replaceAll('{{SESSION}}', ses).replaceAll('{{FILENAME}}', pointer);
        }
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/Image', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onload = resolve;
          xhr.onerror = reject;
          xhr.send(JSON.stringify({
            filepath,
            bucket,
          }));
        });
      },
      /**
       * Creates the Signed URL for accessing brainswipes s3 bucket on MSI
       */
      async createUrl(pointer) {
        // getting the signed URL
        const url = await this.postRequest(pointer).then(data =>
          data.currentTarget.responseText,
        );
        // setting the url key based on the new url
        const urlKey = url.split('?')[0];
        // updating the data elements
        this.imgUrl = url;
        this.imgKey = urlKey;
      },
      imageError() {
        this.imgUrl = '/static/not-found.png';
      },
    },
    watch: {
      async widgetPointer() {
        await this.createUrl(this.widgetPointer);
      },
    },
  };
</script>

<style scoped>
  .imageStatic {
    max-height: 500px;
    height: calc(100vw + 20px);
  }
  .user-card {
    max-width: 500px;
    height: fit-content;
    width: 100%;
    border: 1px solid #ccc;
    padding: 8px;
    box-shadow: 0px 2px 5px 0px #ccc;
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    background-color: white;
  }
  .user-card__picture {
    width: 100%;
    display: block;
  }
  .image_area {
    background: black;
    position: relative;
    aspect-ratio : 1 / 1;
    overflow-y: hidden;
  }
  .loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9;
  }
  .user-card__name {
      margin-bottom: 0;
      margin-top: 8px;
  }
</style>
