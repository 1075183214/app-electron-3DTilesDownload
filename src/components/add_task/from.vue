<template>
  <el-form ref="formRef" :model="form" label-width="120px">
    <el-form-item label="任务名称">
      <el-input v-model="form.name" placeholder="名称"></el-input>
    </el-form-item>
    <el-form-item label="输入地址">
      <el-input v-model="form.url" placeholder="组织文件地址" @change="parse_url"></el-input>
    </el-form-item>
    <el-form-item label="选择下载目录">
      <el-input v-model="form.dir" @click="select_dir"></el-input>
    </el-form-item>
    <el-form-item label="起始位置">
      <el-input v-model.number="form.worker"></el-input>
    </el-form-item>
  </el-form>
</template>
<script setup>
import { reactive, defineEmits } from "vue";
import { ElMessage } from "element-plus";
const { ipcRenderer } = require("electron");

const form = reactive({
  url: "",
  name: "",
  dir: "",
  worker: 0
});
const emit = defineEmits(["success"]); // defineEmits不是个函数或者对象，是编译setup时候的一个标识
console.log(typeof defineEmits); // undefined
const data_url = []; // b3dm实体地址
const json_data = [];
const promise_arr = []; // 任务序列
let base_url = "";

const select_dir = () => {
  const dir = ipcRenderer.sendSync("synchronous-message", "openDirSelect");
  form.dir = dir[0];
};
const parse_url = () => {
  if (!is_B3DMURL_url(form.url)) {
    ElMessage({
      message: "地址不匹配",
      type: "warning"
    });
    return;
  }
  base_url = form.url.substring(0, form.url.lastIndexOf("/"));
  get_b3dm_url(form.url, "");
  is_url_load_over();
};

let task_count = 0; // 任务总数
let task_over_count = 0; // 任务完成数量
let root_fail = false;

const get_b3dm_url = (url, path) => {
  task_count++;
  const task = new Promise((resolve, reject) => {
    fetch(url, { method: "GET", mode: "cors", credentials: "omit" })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const root = data.root;

        json_data.push({ path, data: JSON.stringify(data) });

        if (root.content) {
          if (root.content.uri === undefined && root.content.url !== undefined) {
            root.content.uri = root.content.url;
          }
          if (is_B3DM_url(root.content.uri)) {
            data_url.push({ path: path + "/" + root.content.uri });
          } else if (is_B3DMURL_url(root.content.uri)) {
            let uri = root.content.uri;
            let _path = uri.substring(0, uri.lastIndexOf("/"));
            get_b3dm_url(base_url + path + "/" + uri, path + "/" + _path);
          }
        }
        if (root.children && root.children.length > 0) {
          parseChildren(root.children, path);
        }
        task_over_count++;
        resolve();
      })
      .catch((error) => {
        if (task_count == 1) {
          root_fail = true;
          ElMessage({
            message: "根节点获取失败！",
            type: "error"
          });
        }
        task_over_count++;
        console.error("Error:", error);
        resolve();
      });
  });
  promise_arr.push(task);
};
const parseChildren = (children, path) => {
  for (let item of children) {
    if (item.content) {
      if (item.content.uri === undefined && item.content.url !== undefined) {
        item.content.uri = item.content.url;
      }
      if (is_B3DM_url(item.content.uri)) {
        data_url.push({ path: path + "/" + item.content.uri });
      } else if (is_B3DMURL_url(item.content.uri)) {
        let _url = item.content.uri;
        let _path = _url.substring(0, _url.lastIndexOf("/"));
        get_b3dm_url(base_url + path + "/" + _url, path + "/" + _path);
      }
    }
    if (item.children && item.children.length > 0) {
      parseChildren(item.children, path);
    }
  }
};
const success = () => {
  emit("success", { index: 1, data_url, name: form.name, base_url, json_data, dir: form.dir, worker: form.worker });
};
let lastNumber;
const is_url_load_over = () => {
  const interval = setInterval(() => {
    if (task_count === task_over_count && task_over_count === lastNumber && !root_fail) {
      success();
      window.clearInterval(interval);
    } else {
      lastNumber = task_over_count;
    }
  }, 1000);
};
const is_B3DM_url = (url) => {
  const patt = /.b3dm/;
  return patt.test(url);
};
const is_B3DMURL_url = (url) => {
  const patt = /.tileset.json/;
  return patt.test(url);
};
</script>
<style scoped>
a {
  color: #42b983;
}
.el-form {
  padding-top: 30px;
}
.el-form /deep/.el-form-item__content {
  margin-left: 0px !important;
}
.el-input {
  min-width: 260px;
}
:deep(.el-form-item__label) {
  color: black;
}
</style>
