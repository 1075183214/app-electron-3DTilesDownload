<!--
 * @Descripttion: xxxx代码
 * @version: 1.0.0
 * @Author: limeng
 * @Date: 2022-02-24 15:37:19
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-03-07 17:16:19
-->
<template>
  <component :is="form" @success="listener"></component>
  <el-button class="next" type="success" style="margin-top: 12px" @click="next" :disabled="can_next">完成</el-button>
</template>
<script setup>
import { ref, defineEmits } from "vue";
import form from "./add_task/from.vue";

/**
 * 步骤控制
 */
let task_name = "";
let b3dm_url = [];
let download_root = "";
let worker = 0;
let base_url = "";
let json_data = [];

const emit = defineEmits(["success"]);
let can_next = ref(true);
/**
 * 接收参数
 */
const listener = (value) => {
  can_next.value = false;
  task_name = value.name;
  b3dm_url = value.data_url;
  base_url = value.base_url;
  download_root = value.dir;
  json_data = value.json_data;
  if (value.worker > 0) {
    worker = value.worker;
  }
};
const next = () => {
  emit("success", { b3dm_url, download_root, json_data, task_name, base_url, worker });
};
</script>
<style scoped>
a {
  color: #42b983;
}
.next {
  position: absolute;
  bottom: 35px;
  left: calc(50% - 86px);
}
.el-steps,
.el-steps--simple {
  padding: 6px 8% !important;
}
</style>
