# apply 、 call 、bind

## call

### 基本概念

call() 方法使用一个指定的 this 值和单独给出的一个或多个参数来调用一个函数。

## apply

### 基本概念

apply() 方法调用一个具有给定this值的函数，以及作为一个数组（或类似数组对象）提供的参数。

## bind

### 基本概念

bind() 方法创建一个新的函数，在 bind() 被调用时，这个新函数的 this 被指定为 bind() 的第一个参数，而其余参数将作为新函数的参数，供调用时使用。

## call、apply、bind

他们的作用都是动态改变了上下文，也就是改变了this的指向。

代码示例

```javascript
function Person() {}
Person.prototype = {
  name: 'lee',
  showName: function () {
    console.log(this.name)
  },
}

Person.prototype.showName() // lee

let obj = {
  name: 'herry',
}

Person.prototype.showName.call(obj) // herry
Person.prototype.showName.apply(obj) // herry
Person.prototype.showName.bind(obj)() // herry
```

## call、apply、bind区别

- call和apply 改变了函数的this上下文之后「**便立即执行函数**」，bind则是返回改变了上下文后的一个函数。也就是call 和apply 立即执行，「**bind不立即执行**」
- call和apply基本类似，但是他们立即传入的参数不一样，call方法接收的时若干个参数列表，apply接收的时一个包含多个的参数的数组。
