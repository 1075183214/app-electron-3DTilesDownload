<template>
  <el-container style="height: 100%; padding-top: 8px">
    <el-container>
      <el-aside width="64px">
        <div>
          <el-menu default-active="0" :collapse="true" class="el-menu-vertical-demo" @select="menuSelect">
            <el-menu-item index="4">
              <el-icon><folder-add /></el-icon>
              <span>新建</span>
            </el-menu-item>
            <el-menu-item index="0">
              <el-icon><video-play /></el-icon>
              <span>当前任务</span>
            </el-menu-item>
            <el-menu-item index="1">
              <el-icon><folder-checked /></el-icon>
              <span>已完成</span>
            </el-menu-item>
            <el-menu-item index="2">
              <el-icon><folder-remove /></el-icon>
              <span>已取消</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-aside>
      <el-container style="background-color: rgba(255, 255, 255, 0.3)">
        <el-main class="pageBox" v-cloak>
          <component
            :tasks="task"
            :is="active === 0 ? CurrentTask : active === 1 ? finishedTask : active === 2 ? cancelTask : AddTask"
            @success="addQueue"
            @delete-task="deleteTask"
            @stop-task="stopTask"
          ></component>
        </el-main>
      </el-container>
    </el-container>
  </el-container>
</template>
<script setup>
import { ref, reactive } from "vue";
import CurrentTask from "./CurrentTask.vue";
import cancelTask from "./cancel.vue";
import finishedTask from "./Finished.vue";
import AddTask from "./AddTask.vue";
import { FolderRemove, VideoPlay, FolderAdd, Setting, FolderChecked } from "@element-plus/icons-vue";

const fs = require("fs");
const { ipcRenderer } = require("electron");

defineProps({
  msg: String
});

const count = ref(0);
let task = reactive([]);
let task_count = 1;

let active = ref(0); // 0 - 当前任务  1 - 已完成 / 2 - 已取消  / 3 -添加任务 /4 - 系统设置

const menuSelect = (index) => {
  active.value = parseInt(index);
};

// 取消任务
const stopTask = (value) => {
  for (let item of task) {
    if (item.task_name === value.task_name) {
      item.is_stop = value.to_stop;
    }
    if (!value.to_stop) {
      item.is_start = false;
    }
  }
};

// 停止任务
const deleteTask = (value) => {
  for (let item of task) {
    if (item.task_name === value.task_name) {
      item.is_delete = true;
      item.is_start = false;
    }
  }
};

// 读取保存的任务队列
const read_saved_task = () => {
  try {
    let data = fs.readFileSync(__dirname + "\\task.backup", "utf8");
    const task_arr = JSON.parse(data);
    task.push.apply(task, task_arr);
  } catch (e) {
    console.log(e);
  }
};
read_saved_task();

// 添加任务队列
const addQueue = (value) => {
  let { b3dm_url, download_root, json_data, task_name, base_url, worker } = value;
  task.push({
    task_name,
    b3dm_url,
    worker,
    json_data,
    success: {},
    error: {},
    is_delete: false,
    is_stop: false, // 任务整体是否停止
    is_success: false, // 任务整体是否完成
    is_start: false, // 指示当前是否在运行
    download_root,
    base_url
  });

  // 切换到current_task
  active.value = 0;
};

/**
 * 任务调度
 *    使用定时器每隔10秒调度一次任务
 *    队列中的当前未进行（start）且没stop、delete、success的任务开始下载
 *    下载中如果stop、delete、success 结束任务进行（for循环结束）
 */
const schedule = () => {
  setInterval(async () => {
    for (let item of task) {
      check_success(item);
      if (!item.is_stop && !item.is_delete && !item.is_start && !item.is_success) {
        item.is_start = true;
        // 写入json
        for (let [index, d] of item.json_data.entries()) {
          writeOut(d.data, item.download_root + d.path.replaceAll("/", "\\") + "\\tileset.json");
        }
        // 下载实体
        for (let [index, d] of item.b3dm_url.entries()) {
          if (item.is_delete) {
            return;
          }
          while (item.is_stop) {
            await wait_10_sec();
          }
          if (index < item.worker) {
            continue;
          }
          if (item.success[d.path] || item.error[d.path]) {
            continue;
          }
          await wait_10_sec();
          download(item, item.base_url + "/" + d.path, d.path);
        }
      }
    }
  }, 10000);
};
schedule();

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
  writeOut(buffer, task.download_root + path.replaceAll("/", "\\"));
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

// 工具 - 线程等待
const wait_10_sec = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 50);
  });
};

// 退出保存任务信息
ipcRenderer.on("saveTask", (event, arg) => {
  for (let item of task) {
    item.is_stop = true;
    item.is_start = false;
  }
  save_task();
});
const save_task = () => {
  const str = JSON.stringify(task);
  writeOut(str, __dirname + "\\task.backup", send_quit_singal);
};
const send_quit_singal = () => {
  console.log("quit");
  ipcRenderer.sendSync("quit", "quit");
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
  border-bottom: 1px solid grey;
  padding-bottom: 5px;
  align-items: center;
}
.el-main {
  --el-main-padding: 8px;
}
.el-menu {
  background-color: white;
  color: black;
  .el-menu-item {
    color: greenyellow;
  }
  .el-menu-item:hover {
    background-color: dimgray;
  }
}
.el-button-group {
  // margin-left: 117px;
  margin-bottom: 5px;
}
.el-aside {
  --el-aside-width: 64px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #dcdde0;
  background-color: white;
  overflow-x: hidden;
}
.pageBox {
  height: calc(100vh - 10px);
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: flex-start;
  align-items: flex-start;

  :deep(.el-card) {
    width: 228px;
  }
  :deep(.el-card__header) {
    padding: 5px;
    border-bottom: 1px solid var(--el-card-border-color);
    box-sizing: border-box;
  }
  :deep(.el-card__body) {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: column;
    align-content: flex-start;
    justify-content: flex-start;
    align-items: flex-start;
    line-height: 30px;
    padding: 10px;
    font-size: 12px;
  }
}
a {
  color: #42b983;
}
.block {
  height: 60px;
  /* width: 60px; */
  text-align: center;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 6px;

  .el-image {
    border-radius: 50%;
    img {
      border-radius: 50%;
    }
  }
}
</style>
