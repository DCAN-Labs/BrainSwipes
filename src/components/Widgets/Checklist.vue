<template name="checklist">
    <div class="checklist" ref="checklist">
        <div class="checklist-wrapper">
          <div class="checklist-list">
            <div class="checklist-item" v-for="(value, index) in config.learn.checklists[imageClass]" :key="index" @click="handleClick(index)">
              <div :class="checks ? checks[index] ? 'checked' : 'unchecked' : userChecks[index] "></div>
              <p>{{config.learn.checklists[imageClass][index]}}</p>
            </div>
          </div>
        </div>
    </div>  
</template>

<script>
  export default {
    data() {
      return {
        /**
         * when no checks are given to the component a user can click the checks to set their own.
         */
        userChecks: [],
      };
    },
    props: {
      /**
       * The config object that is loaded from firebase
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
       * or 'question'
       */
      checks: {
        type: Array,
        required: false,
      },
      /**
       * for use with setting values in the parent component
       */
      sample: {
        type: String,
        required: false,
      },
    },
    methods: {
      handleClick(index) {
        if (!this.checks) {
          const userChecks = [...this.userChecks];
          if (userChecks[index] === 'checked') {
            userChecks[index] = 'unchecked';
          } else {
            userChecks[index] = 'checked';
          }
          this.userChecks = userChecks;
          this.$emit('checkBoxClick', this.sample, userChecks);
        }
      },
      setUserDefinedChecks() {
        this.userChecks = Array(this.config.learn.checklists[this.imageClass].length).fill('checked-question');
      },
    },
    mounted() {
      this.setUserDefinedChecks();
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

  .checked, .unchecked, .checked-question{
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

