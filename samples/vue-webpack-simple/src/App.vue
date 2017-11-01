<template>
  <div id="app">
    <img src="./assets/logo.png">
    <h1>{{ msg }}</h1>
    <h2>Essential Links</h2>
    <button @click="getWeb"> Get web info</button>
    <button @click="getDigest"> Get request digest</button>
  </div>
</template>

<script>
import * as $ from "jquery";
export default {
  name: "app",
  data() {
    return {
      msg: "Welcome to Your Vue.js App"
    };
  },
  methods: {
    getWeb() {
      $.ajax({
        url: "_api/web",
        method: "GET",
        headers: {
          "Accept": "application/json;odata=verbose"
        }
      }).then(function(data) {
        console.log(data);
      });
    },
    getDigest() {
      $.ajax({
        url: "_api/contextinfo",
        method: "POST",
        headers: {
          "Accept": "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose"
        }
      }).then(function(data) {
        console.log(data);
      });
    }
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
