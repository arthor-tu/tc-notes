# Teleport

## Teleport的基本使用

参考官方文档[Teleport | Vue.js](https://cn.vuejs.org/guide/built-ins/teleport.html#basic-usage)

\<Teleport\> 是一个内置组件，它可以将一个组件内部的一部分模板“传送”到该组件的 DOM 结构外层的位置去。

### 基本使用方法
```html
<button @click="open = true">Open Modal</button>

<Teleport to="body">
  <div v-if="open" class="modal">
    <p>Hello from the modal!</p>
    <button @click="open = false">Close</button>
  </div>
</Teleport>
```

<Teleport> 接收一个 to prop 来指定传送的目标。to 的值可以是一个 CSS 选择器字符串，也可以是一个 DOM 元素对象。这段代码的作用就是告诉 Vue“把以下模板片段传送到 body 标签下”。

### Teleport和Transition的结合

我们也可以将 <Teleport> 和 <Transition> 结合使用来创建一个带动画的模态框。见[官方示例](https://cn.vuejs.org/examples/#modal)。

## 笔记

### 多个 Teleport 共享目标​

一个可重用的模态框组件可能同时存在多个实例。对于此类场景，多个 <Teleport> 组件可以将其内容挂载在同一个目标元素上，而顺序就是**简单的顺次追加**，后挂载的将排在目标元素下更后面的位置上。


比如下面这样的用例：

```html
<Teleport to="#modals">
  <div>A</div>
</Teleport>
<Teleport to="#modals">
  <div>B</div>
</Teleport>
```

渲染的结果为：

```html
<div id="modals">
  <div>A</div>
  <div>B</div>
</div>
```