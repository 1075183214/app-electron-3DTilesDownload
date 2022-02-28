<template>
  <el-container>
    <el-header>
      <el-avatar src="../image/头像.jpg"></el-avatar>
      <el-button-group>
        <el-button type="success" size="small" :icon="ArrowLeft">添加任务</el-button>
        <el-button type="success" size="small"> 全部暂停</el-button>
        <el-button type="success" size="small"> 全部取消</el-button>
      </el-button-group>
    </el-header>
    <el-container>
      <el-aside width="148px">
        <el-menu default-active="1" class="el-menu-vertical-demo">
          <el-menu-item index="1">
            <el-icon><location /></el-icon>
            <span>当前任务</span>
          </el-menu-item>
          <el-menu-item index="2">
            <el-icon><icon-menu /></el-icon>
            <span>已完成</span>
          </el-menu-item>
          <el-menu-item index="3">
            <el-icon><document /></el-icon>
            <span>失败任务</span>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon><document /></el-icon>
            <span>任务统计</span>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon><setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-main class="pageBox"><AddTask @success="addQueue"></AddTask></el-main>
      </el-container>
    </el-container>
  </el-container>
</template>
<script setup>
const fs = require("fs");
import { ref } from "vue";
import CurrentTask from "./CurrentTask.vue";
import AddTask from "./AddTask.vue";
import { Location, Document, Menu as IconMenu, Setting } from "@element-plus/icons-vue";
defineProps({
  msg: String
});

const count = ref(0);
let task = [];
let task_count = 1;

// 添加任务队列
const addQueue = (value) => {
  let { b3dm_url, download_root, task_name, base_url, worker } = value;
  task.push({
    task_name,
    b3dm_url,
    worker,
    success: {},
    error: {},
    is_delete: false,
    is_stop: false,
    is_success: false,
    is_start: false,
    download_root,
    base_url
  });
};

// 任务调度
const schedule = () => {
  setInterval(async () => {
    for (let item of task) {
      check_success(item);

      if (!item.is_stop && !item.is_delete && !item.is_start && !item.is_success) {
        item.is_start = true;
        for (let [index, d] of item.b3dm_url.entries()) {
          if (index > item.worker) {
            return;
          }
          if (item.success[d.path] || item.error[d.path]) {
            return;
          }
          download(item, item.base_url + "/" + d.path, d.path);
        }
      }
    }
  }, 10000);
};

// 检查任务是否完成
const check_success = (sub_task) => {
  const success_keys = Object.keys(sub_task.success);
  const error_keys = Object.keys(sub_task.error);
  if (sub_task.b3dm_url.length <= success_keys.length + error_keys.length) {
    sub_task.is_success = true; // 标志完成
    return true;
  } else {
    return false;
  }
};

// 处理返回信息
const deal_download_file = async (response, task, url, path) => {
  let buffer = await response.arrayBuffer();
  buffer = Buffer.from(buffer);
  const name = url.substring(url.lastIndexOf("/") + 1, url.length);
  writeOut(buffer, task.download_root + "\\" + path.replace("/", ""));
};

// 执行fetch下载，标识状态
const download = (task, url, path) => {
  fetch(url, { method: "GET", mode: "cors", credentials: "omit" })
    .then(async (response) => {
      if (response.status == 200) {
        deal_download_file(response, task, url, path);
        task.success[path] = true;
      } else {
        task.error[path] = true;
      }
    })
    .catch((error) => {
      task.error[path] = true;
    });
};

// node写出文件
const writeOut = (dataBuffer, file_path) => {
  fs.writeFile(file_path, dataBuffer, () => {});
};

// 工具 - 线程等待
const wait_10_sec = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 10);
  });
};
schedule();
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
.pageBox {
  height: calc(100vh - 70px);
  position: relative;
}
a {
  color: #42b983;
}
</style>
