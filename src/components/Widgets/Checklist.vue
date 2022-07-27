<template name="checklist">
    <div class="checklist" ref="checklist">
        <div class="checklist-wrapper">
          <div class="checklist-list">
            <div class="checklist-item" v-for="(value, index) in checks" :key="index"><div :class="value ? 'checked' : 'unchecked'"></div><p>{{config.tutorial.checklists[imageClass][index]}}</p></div>
          </div>
        </div>
    </div>  
</template>

<script>
  export default {
    data() {
      return {

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
       * Class of the image that is being checked
       */
      imageClass: {
        type: String,
        required: true,
      },
      /**
       * Object contains the class of the image and an array of true/false values
       */
      checks: {
        type: Array,
        required: true,
      },
    },
  };
</script>

<style>
  .checklist-item{
    display: flex;
    font-size: 1.1em;
    border-style: outset;
    padding: 2px 4px;
    border-width: 1px;
    text-align: left;
    align-items: center;
  }

  .checklist-item p{
    padding-left: 5px;
  }

  .checklist-list{
    max-width: 500px;
  }

  .checklist-wrapper{
    margin-top: 5px;
    display: flex;
    justify-content: center;
  }

  .checked, .unchecked{
    margin-right: 5px;
  }

  .checked::before{
    display: block;
    content: ' ';
    background-image: url('../../assets/check-square.svg');
    background-repeat: no-repeat;
    background-size: 28px 28px;
    height: 28px;
    width: 28px;
  }

  .unchecked::before{
    display: block;
    content: ' ';
    background-image: url('../../assets/square.svg');
    background-repeat: no-repeat;
    background-size: 28px 28px;
    height: 28px;
    width: 28px;
  }

  .checked-question::before{
    display: block;
    content: ' ';
    background-image: url('../../assets/question-square.svg');
    background-repeat: no-repeat;
    background-size: 28px 28px;
    height: 28px;
    width: 28px;
  }
</style>

