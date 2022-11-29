# 函数  

## 偏函数

原始函数预设参数作为一个新函数

```js
const partial = (f, ...args) => (...more) => f(...args, ..more)

const add = (a,b,c) => a + b + c

const fivePlus = partial(add, 2, 3)

fivePlus(4)//输出9
```

类似的比如使用`bind`函数

```js
var addMore = add.bind(null, 2, 3)
```

## 函数柯里化  

通过偏应用函数实现,它是把一个多参数函数转换为一个嵌套一元函数的过程  

## 函数的反柯里化  

## 函数组合  
