<template>
  <el-form ref="formRef" :model="form" label-width="80px">
    <el-form-item>
      <el-form-item label="下载进程数">
        <el-input v-model="form.worker" @change="success"></el-input>
      </el-form-item>
    </el-form-item>
  </el-form>
</template>
<script setup>
import { reactive, defineEmits } from "vue";

const form = reactive({
  dir: ""
});
const emit = defineEmits(["success"]);
const success = () => {
  emit("success", { index: 3, dir: form.dir });
};
</script>
<style scoped>
a {
  color: #42b983;
}
.el-form {
  padding-top: 30px;
}
</style>
