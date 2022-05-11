<template>
  <div id="results">
      <p>{{datasetPrivileges}}</p>
      <p>test</p>
  </div>
</template>

<script>
export default {
    name: 'Results',
    data() {},
    props: {
        datasetPrivileges: {
        type: Object,
        required: true,
        },
        db: {
        type: Object,
        required: true,
        },
        studies: {
        type: Object,
        required: true,
        },
        globusToken: {
        type: String,
        required: true,
        },
        userInfo: {
        type: Object,
        required: true,
        },
    },
};
</script>

<style>

</style>