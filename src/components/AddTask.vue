<template>
  <el-steps :active="active" direction="vertical" simple finish-status="success">
    <el-step title="地址解析" :icon="Edit"></el-step>
    <el-step title="任务参数" :icon="UploadFilled"></el-step>
    <el-step title="下载设置" :icon="Picture"></el-step>
  </el-steps>
  <component :is="active === 0 ? Step1 : active === 1 ? Step2 : Step3" @success="listener"></component>
  <el-button class="next" type="success" style="margin-top: 12px" @click="next" :disabled="can_next">{{ next_title }}</el-button>
</template>
<script setup>
import { ref, reactive, defineEmits } from "vue";
import Step1 from "./add_task/Step1.vue";
import Step2 from "./add_task/Step2.vue";
import Step3 from "./add_task/Step3.vue";
import { Edit, UploadFilled, Picture } from "@element-plus/icons-vue";

/**
 * 步骤控制
 */
let task_name = "";
let b3dm_url = [];
let download_root = "";
let worker = 1;
let base_url = "";

const emit = defineEmits(["success"]);
let active = ref(0);
let can_next = ref(true);
let next_title = ref("下一步");
const next = () => {
  active.value++;
  if (active.value > 2) {
    emit("success", { b3dm_url, download_root, worker, task_name, base_url });
  }
  if (active.value === 2) next_title.value = "完成";
  can_next.value = true;
};
/**
 * 任务执行
 */
const listener = (value) => {
  can_next.value = false;
  const step = value.index;
  if (step === 1) {
    task_name = value.name;
    b3dm_url = value.data_url;
    base_url = value.base_url;
  } else if (step === 2) {
    download_root = value.dir;
  } else if (step === 3) {
    if (value.worker > 0) {
      worker = value.worker;
    }
  }
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
