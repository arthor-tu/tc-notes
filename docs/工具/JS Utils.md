# JS Utils

## 求两个数的最大公因数

```javascript
function gcd(a:number, b:number) {
    return a % b == 0 ? b : gcd(b, a % b)
}
```
