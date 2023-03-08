# 函数  

> 幂等性  f(f(x)) === f(x) Array.sort(Array.sort())

## 纯函数

相同的输入,总会得到相同的输出比如`Array.slice()`,没有任何副作用,不依赖外部环境状态  
特性: 数据可缓存性

## 闭包  

访问作用域外变量的一种方式,实现了变量的私有化
会捕获函数的外部变量，因此即使执行过程已经移出了定义它的那个代码块，也可以访问它们。也就是说，它们允许在声明变量的代码块已经执行完成之后，还是可以引用这个作用域。

```js
const fun = x => y => x + y
const bb = fun(5) // x = 5, 后续使用bb函数时都会调用固定参数x
bb(3) // 8
```

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
把一个多参数的函数，转化为单参数函数。

```js
function disposeQuery () {
      const args = Array.prototype.slice.call(arguments)
      function curried () {
        args.push(...arguments)
        return curried
      }
      curried.valueOf = function () {
        return args.reduce((a1, a2) => a1 + a2)
      }
      curried.toString = function () {
        return args.reduce((a1, a2) => a1 + a2)
      }
      return curried
    }
```

## 自动柯里化

```js
// 缓存目标函数,和参数
const partical = (f, ...args) => (...moreargs) => f(...args, ...moreargs)

// 参数一致则执行,否则缓存参数,并且返回一个函数继续等待
const curry = function (add, len = add.length) {
  return (...args) => len - args.length <= 0 ? add(...args) : curry(partical(add, ...args), len - args.length) 
}

const add6 = (a, b, c, d, e, f) => a + b + c + d + e + f

console.log(curry(add6)(1, 2, 3)(4, 5, 6))
console.log(curry(add6)(1)(2, 3)(4, 5, 6))
console.log(curry(add6)(1, 2)(3)(4, 5, 6))
console.log(curry(add6)(1, 2)(3)(4)(5, 6))
```

## 函数的反柯里化  

## 函数组合  
