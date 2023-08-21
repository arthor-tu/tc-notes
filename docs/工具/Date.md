# Date

## 日期格式转化

### 设计思路

- 利用正则匹配相应格式，并替换。

### Code

```javascript
function transDate(val) {
  val = val + "";
  return val.length === 1 ? "0" + val : val;
}
/**
/*对Date的扩展，将 Date 转化为指定格式的String
/* 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
/* 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
*/
Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "H+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) {
    let matchList = /(y+)/[Symbol.match](fmt) || [];
    fmt = fmt.replace(
      /(y+)/,
      (this.getFullYear() + "").substring(4 - matchList[0].length, 4)
    );
  }
  for (var k in o) {
    let reg = new RegExp(`(${k})`, "g");
    let matchList = reg[Symbol.match](fmt) || [];
    for (var i = 0; i < matchList.length; i++) {
      let str = "00" + o[k];
      fmt = fmt.replace(
        matchList[i],
        str.substring(
          str.length - matchList[i].length < 0
            ? 0
            : str.length - matchList[i].length,
          str.length
        )
      );
    }
  }

  return fmt;
};
```

### 例子

```javascript
(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") // 2022-01-02 10:19:04.423
(new Date()).Format("yyyy-M-d h:m:s.S")      // 2022-1-2 10:19:4.18
```
