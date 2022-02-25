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
        <el-main class="pageBox"><AddTask @add-task-success="addQueue"></AddTask></el-main>
      </el-container>
    </el-container>
  </el-container>
</template>
<script setup>
import { t } from "../dist/assets/vendor.65715d52";

const { ipcRenderer } = require("electron");
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
const addQueue = (value) => {
  let { b3dm_url, download_root, task_name } = value;
  task.push({ task_name, b3dm_url, success: {}, error: {}, is_delete: false, is_stop: false, download_root });
};
const download = (task, url) => {
  fetch(url, { method: "GET", mode: "cors" })
    .then((response) => {
      if (response.status == 200) {
        let buffer = await response.arrayBuffer();
        buffer = Buffer.from(buffer);
        const name = url.substring(url.lastIndexOf("/") + 1, url.length);
        writeOut(buffer, task.download_root, name);
      } else {
        task.error[url] = false;
      }
    })
    .catch((error) => {
      task.error[url] = false;
    });
};
const writeOut = (dataBuffer, dir, name) => {
  fs.writeFileSync(this.outDir[0] + "\\" + name, dataBuffer);
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
.pageBox {
  height: calc(100vh - 70px);
  position: relative;
}
a {
  color: #42b983;
}
</style>
