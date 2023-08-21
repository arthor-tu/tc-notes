# Storage封装

## 封装方案

- 数据结构：

```javascript
 let obj = {
    name: name,                // key值
    dataType: typeof content,  // 数据类型
    content: content,          // 数据内容
    type: type,                // localStorage: false; sessionStorage：true
    datetime: new Date().getTime(),     // 有效时间
}
```

- 参数说明
  - dataType： 存储数据的数据类型，由于Storage只能以字符串的形式存储，在get时根据dataType将数据转化为存储前的数据类型。
  - content： 数据内容，放数据的。
  - type：区分localStorage和sessionStorage
  - datetime：手动加的数据有效时间，超时则get时返回undefined

## Code

```javascript
import { validatenull } from "@/utils/validate";
import website from "@/config/website";

const keyName = website.storeKey + "-";
/**
 * 存储localStorage
 */
export const setStore = (params = {}) => {
    let { name, content, type } = params;
    name = keyName + name;
    let obj = {
        dataType: typeof content,
        content: content,
        type: type,
        datetime: new Date().getTime(),
    };
    if (type) window.sessionStorage.setItem(name, JSON.stringify(obj));
    else window.localStorage.setItem(name, JSON.stringify(obj));
};
/**
 * 获取localStorage
 */

export const getStore = (params = {}) => {
    let { name, debug } = params;
    name = keyName + name;
    let obj = {},
        content;
    obj = window.sessionStorage.getItem(name);
    if (validatenull(obj)) obj = window.localStorage.getItem(name);
    if (validatenull(obj)) return;
    try {
        obj = JSON.parse(obj);
    } catch {
        return obj;
    }
    if (debug) {
        return obj;
    }
    if (obj.dataType == "string") {
        content = obj.content;
    } else if (obj.dataType == "number") {
        content = Number(obj.content);
    } else if (obj.dataType == "boolean") {
        content = eval(obj.content);
    } else if (obj.dataType == "object") {
        content = obj.content;
    }
    return content;
};
/**
 * 删除localStorage
 */
export const removeStore = (params = {}) => {
    let { name, type } = params;
    name = keyName + name;
    if (type) {
        window.sessionStorage.removeItem(name);
    } else {
        window.localStorage.removeItem(name);
    }
};

/**
 * 获取全部localStorage
 */
export const getAllStore = (params = {}) => {
    let list = [];
    let { type } = params;
    if (type) {
        for (let i = 0; i <= window.sessionStorage.length; i++) {
            list.push({
                name: window.sessionStorage.key(i),
                content: getStore({
                    name: window.sessionStorage.key(i),
                    type: "session",
                }),
            });
        }
    } else {
        for (let i = 0; i <= window.localStorage.length; i++) {
            list.push({
                name: window.localStorage.key(i),
                content: getStore({
                    name: window.localStorage.key(i),
                }),
            });
        }
    }
    return list;
};

/**
 * 清空全部localStorage
 */
export const clearStore = (params = {}) => {
    let { type } = params;
    if (type) {
        window.sessionStorage.clear();
    } else {
        window.localStorage.clear();
    }
};

```

## 使用示例

```javascript
import {getStore, setStore, removeStore} from '@/util/store.js';

const data = {
    a: "a",
    b: 2,
}

setStore({name: "data-name", content: data});

const data_2 = setStore({name: "data-name"});  // data_2 = {a: "a", b: "b"}

removeStore({name: "data-name"}); // remove
```

