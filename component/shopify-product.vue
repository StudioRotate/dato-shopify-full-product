<template>
  <div>
    <h1>{{ test }}</h1>
  </div>
</template>

<script>
  const DatoCmsPlugin = require("datocms-plugins-sdk");

  export default {
    name: "ShopifyProduct",

    data() {
      return {
        test: "AOUIYFTCFXDGCVHJKLssss"
      };
    },

    async mounted() {
      const plugin = await DatoCmsPlugin.init();

      console.log(plugin);
    }
  };
</script>

