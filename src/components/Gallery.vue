<template name="gallery">
  <div id="gallery" class="container">
    <!-- Title -->
    <div>
      <h1>Gallery of Advanced Cases</h1>
      <p class="lead">Get expert advice on difficult samples.</p>
      <p>Have something you want added? Flag it by clicking the Help button.</p>
      <hr>
    </div>
    <div v-if="loading">
      LOADING...
      <Flask/>
    </div>
    <div v-else>
      <div class="gallery-item" v-for="sample in Object.keys(gallery)" :key="sample">
        <div class="gallery-info">
          <h2>{{gallery[sample].label}}</h2>
          <p>{{gallery[sample].text}}</p>
          <Checklist v-if="gallery[sample].checks"
            :config="config"
            :imageClass="getImageType(gallery[sample].pointer)[0]"
            :checks="gallery[sample].checks"
          />
        </div>
        <ImageSwipe
          :widgetPointer="gallery[sample].pointer"
          :playMode="'tutorial'"
          :identifier="sample"
          :tutorialStep="gallery[sample].answer"
          ref="widget"
          :dataset="tutorialDataset"
          :bucket="tutorialBucket"
        />
      </div>
    </div>
  </div>
</template>

<style>

  .img {
    max-height: 80vh;
    width: 100%;
    max-width: 500px;
    margin-bottom: 35px;
  }

  .gallery-item h2{
    font-size: 1.5em;
    font-weight: 700;
    color: #640000;
    margin-bottom: 10px;
  }

  .gallery-item {
    padding-bottom: 15vh;
  }

  .gallery-info {
    padding-bottom: 10px;
  }

</style>

<script>
/**
 * TODO: fill this in.
 */
  import ImageSwipe from './Widgets/ImageSwipe';
  import Checklist from './Widgets/Checklist';
  import Flask from './Animations/Flask';

  /* eslint-enable */

  export default {
    name: 'gallery',
    components: {
      ImageSwipe,
      Checklist,
      Flask,
    },
    data() {
      return {
        /**
         * The list of images for the gallery.
         * Populated from firebase by getGallery()
         */
        gallery: {},
        /**
         * Whether the component's data is loading
         */
        loading: true,
      };
    },
    props: {
      /**
       * The config object that is loaded from src/config.js.
       * It defines how the app is configured, including
       * any content that needs to be displayed (app title, images, etc)
       * and also the type of widget and where to update pointers to data
       */
      config: {
        type: Object,
        required: true,
      },
      /**
       * The firebase database
       */
      db: {
        type: Object,
        required: true,
      },
    },
    computed: {
      /**
       * The steps defined in config, with text and images to display.
       */
      steps() {
        return this.config.tutorial.practice;
      },
      /**
       * dataset that the tutorial images are from
       */
      tutorialDataset() {
        return this.config.tutorial.dataset;
      },
      /**
       * s3 bucket where the tutorial images are held
       */
      tutorialBucket() {
        return this.config.tutorial.bucket;
      },
    },
    methods: {
      getImageType(pointer) {
        const imageType = [];
        if (pointer.match(/atlas/i)) {
          imageType[0] = 'atlasRegistration';
          imageType[1] = 'Atlas Registration';
        } else if (pointer.match(/task/i)) {
          imageType[0] = 'functionalRegistration';
          imageType[1] = 'Functional Registration';
        } else {
          imageType[0] = 'surfaceDelineation';
          imageType[1] = 'Structural Image';
        }
        return imageType;
      },
      async getGallery() {
        this.db.ref('config/learn/gallery').on('value', (snap) => {
          this.gallery = snap.val();
          this.loading = false;
        });
      },
    },
    async created() {
      this.getGallery();
    },
  };
</script>
