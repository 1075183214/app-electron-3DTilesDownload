<template>
  <el-form ref="formRef" :model="form" label-width="120px">
    <el-form-item>
      <el-form-item label="任务名称">
        <el-input v-model="form.name" placeholder="xxx/tileset.json"></el-input>
      </el-form-item>
      <el-form-item label="输入地址">
        <el-input v-model="form.url" placeholder="xxx/tileset.json" @change="parse_url"></el-input>
      </el-form-item>
    </el-form-item>
  </el-form>
</template>
<script setup>
import { reactive, defineEmits } from "vue";
import { ElMessage } from "element-plus";

const form = reactive({
  url: "",
  name: ""
});
const emit = defineEmits(["success"]); // defineEmits不是个函数或者对象，是编译setup时候的一个标识
console.log(typeof defineEmits); // undefined
const data_url = []; // b3dm实体地址
const promise_arr = []; // 任务序列
let base_url = "";
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
const get_b3dm_url = (url, path) => {
  task_count++;
  const task = new Promise((resolve, reject) => {
    fetch(url, { method: "GET", mode: "cors" })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const root = data.root;

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
        console.log(base_url + path + "/" + item.content.uri);
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
  emit("success", { index: 1, data_url, name: form.name });
};
let lastNumber;
const is_url_load_over = () => {
  const interval = setInterval(() => {
    if (task_count === task_over_count && task_over_count === lastNumber) {
      success();
      window.clearInterval(interval);
    } else {
      lastNumber = task_over_count;
    }
  }, 5000);
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
</style>
