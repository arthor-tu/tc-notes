# Promise

## 代码简易实现

```javascript
class Promise {
  constructor(func) {
    this.status = 'pending'
    try {
      func(this.resolve.bind(this), this.reject.bind(this))
    } catch (error) {
      this.reject(error)
    }
  }

  resolve(data) {
    if (this.status !== 'pending') return
    this.status = 'resolved'
    this.data = data
    this.successCallback && this.successCallback(this.data)
  }

  reject(error) {
    if (this.status !== 'pending') return
    this.status = 'rejected'
    this.error = error
    this.failCallback && this.failCallback(this.error)
  }

  then(successCallback, failCallback) {
    if (this.status === 'resolved') {
      successCallback(this.data)
    } else if (this.status === 'rejected') {
      failCallback(this.error)
    } else {
      this.successCallback = successCallback
      this.failCallback = failCallback
    }
    return this
  }

  catch(failCallback) {
    if (this.status === 'rejected') {
      failCallback(this.error)
    } else {
      this.failCallback = failCallback
    }
    return this
  }
}
```