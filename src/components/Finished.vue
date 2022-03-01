<template>
  <el-space wrap>
    <div v-for="task in tasks" :key="task.task_name">
      <el-card class="box-card" v-if="task.is_success === true">
        <template #header>
          <div class="card-header">
            <span>{{ task.task_name }}</span>
            <div></div>
          </div>
        </template>
        <span>文件总数: {{ task.b3dm_url.length }}</span>
        <span>已完成: {{ Object.keys(task.success).length }}</span>
        <span>已失败: {{ Object.keys(task.error).length }}</span>
      </el-card>
    </div>
  </el-space>
</template>
<script setup>
import { defineEmits, ref } from "vue";
defineProps({
  tasks: {
    type: Object,
    default: {},
    required: true
  }
});
let to_stop = false;
let stopStatus = ref("暂停");
const emit = defineEmits(["delete-task"]);
const delete_task = (task) => {
  emit("delete-task", { task_name: task.task_name });
};
const stop_task = (task) => {
  to_stop = !to_stop;
  emit("stop-task", { task_name: task.task_name, to_stop });
  if (to_stop) {
    stopStatus.value = "启动";
  } else {
    stopStatus.value = "暂停";
  }
};
</script>
<style lang="less" scoped>
.el-avatar--default {
  --el-avatar-size: 55px;
}
.el-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  border-bottom: 1px solid #dcdde0;
  padding-bottom: 5px;
}
.el-main {
  --el-main-padding: 10px;
}
.el-button-group {
  margin-left: 117px;
  margin-bottom: 5px;
}
.el-aside {
  --el-aside-width: 149px;
}
a {
  color: #42b983;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header > span {
  margin-left: 5px;
}
</style>
