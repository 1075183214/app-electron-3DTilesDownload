<template>
  <el-form ref="formRef" :model="form" label-width="80px">
    <el-form-item>
      <el-form-item label="选择下载目录">
        <el-input v-model="form.dir" @click="select_dir"></el-input>
      </el-form-item>
    </el-form-item>
  </el-form>
</template>
<script setup>
const { ipcRenderer } = require("electron");
import { reactive, defineEmits } from "vue";

const form = reactive({
  dir: ""
});
const emit = defineEmits(["success"]); // defineEmits不是个函数或者对象，是编译setup时候的一个标识
const success = () => {
  emit("success", { index: 1, dir: form.dir });
};
const select_dir = () => {
  const dir = ipcRenderer.sendSync("synchronous-message", "openDirSelect");
  this.form.dir = dir;
  success();
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
