<template>
  <el-space wrap>
    <div v-for="task in tasks" :key="task.task_name">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>{{ task.task_name }}</span>
            <div>
              <el-button v-if="Object.keys(task.error).length > 0" class="button" type="text" @click="retry(task)">重试</el-button>
            </div>
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
const fs = require("fs");
const { ipcRenderer } = require("electron");

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
const retry = async (task) => {
  for (let key in task.error) {
    await wait_10_sec();
    download(task, task.base_url + "/" + key, key);
  }
};

// 执行fetch下载，标识状态
const download = (task, url, path) => {
  fetch(url, { method: "GET", mode: "cors", credentials: "omit" })
    .then(async (response) => {
      if (response.status == 200) {
        deal_download_file(response, task, url, path);
        task.success[path] = true;
        delete task.error[path];
      }
    })
    .catch((error) => {});
};
// 处理返回信息
const deal_download_file = async (response, task, url, path) => {
  let buffer = await response.arrayBuffer();
  buffer = Buffer.from(buffer);
  const name = url.substring(url.lastIndexOf("/") + 1, url.length);
  writeOut(buffer, task.download_root + path.replaceAll("/", "\\"));
};
// node写出文件
const writeOut = (dataBuffer, file_path, callback) => {
  const dir = file_path.substring(0, file_path.lastIndexOf("\\"));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFile(file_path, dataBuffer, () => {
    if (typeof callback === "function") {
      callback();
    }
  });
};
const wait_10_sec = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 10);
  });
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
