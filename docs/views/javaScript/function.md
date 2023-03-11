# 函数式编程

参考链接:
[functional-programming-jargon](https://github.com/hemanth/functional-programming-jargon)

函数就是函数式编程中的基础元素，可以完成几乎所有的操作，哪怕最简单的计算，也是用函数完成的。我们通常理解的变量在函数式编程中也被函数代替了：在函数式编程中变量仅仅代表某个表达式（这样我们就不用把所有的代码都写在同一行里了）。所以我们这里所说的“变量”是不能被修改的。所有的变量只能被赋一次初值。

> 优点
> 函数式程序更容易理解
> 没有什么函数会有副作用,没有函数可以修改在它作用域之外的值给其他函数继续使用
> 这决定函数执行结果的唯一因素就是它的返回值，而影响其返回值的唯一因素就是它的参数。
> 调试查错很容易

## 幂等性

f(f(x)) === f(x) 比如 Array.sort(Array.sort())

如果一个函数执行多次皆返回相同的结果，则它是幂等的。

## 纯函数

相同的输入,总会得到相同的输出比如`Array.slice()`,没有任何副作用,不依赖外部环境状态  
特性: 数据可缓存性

```js
const greet = (name) => `hello, ${name}`
greet('world')
```

以下代码不是纯函数：

```js
window.name = 'Brianne'

const greet = () => `Hi, ${window.name}`

greet() // "Hi, Brianne"
```

以上示例中，函数输出基于在函数外部存储的数据。

```js
let greeting

const greet = (name) => {
    greeting = `Hi, ${name}`
}

greet('Brianne')
greeting // "Hi, Brianne"
```

以上示例中，函数修改了外部状态。

## 副作用 (Side effects)  

如果一个函数或者表达式除了返回一个值之外，还与外部可变状态进行了交互（读取或写入），则它是有副作用的。
IO操作就是有副作用的

```js
// 直接使用了外部可变的变量,存在副作用
let work = 'lda'
const fn = () => {
  return 'hello' + work
}
console.log(fn())
```

## Point-Free 风格(无参函数)

Pointfree 就是运算过程抽象化，处理一个值，但是不提到这个值。
oint-Free 风格的函数就像平常的赋值，不使用 function 或者 =>

```js
// 示例1
// 这里用到了Ramda库
var prop = (p, obj) => obj[p];
var propRole = R.curry(prop)('role');

var isWorker = s => s === 'worker';
var getWorkers = R.filter(R.pipe(propRole, isWorker));

var data = [
  {name: '张三', role: 'worker'},
  {name: '李四', role: 'worker'},
  {name: '王五', role: 'manager'},
];
getWorkers(data)
```

```js
// 示例2 字符串中最长的单词有多少个字符
var str = 'Lorem ipsum dolor sit amet consectetur adipiscing elit';

// 以空格分割单词
var splitBySpace = s => s.split(' ');

// 每个单词的长度
var getLength = w => w.length;

// 词的数组转换成长度的数组
var getLengthArr = arr => R.map(getLength, arr); 

// 返回较大的数字
var getBiggerNumber = (a, b) => a > b ? a : b;

// 返回最大的一个数字
var findBiggestNumber = arr => R.reduce(getBiggerNumber, 0, arr);

var getLongestWordLength = R.pipe(
  splitBySpace,
  getLengthArr,
  findBiggestNumber
);

console.log(getLongestWordLength(str));
```

## 断定 (Predicate)

根据输入返回 true 或 false。通常用在 array filter 的回调函数中。

```js
const predicate = (a) => a > 2;
[1, 2, 3, 4].filter(predicate)
```

## 契约 (Contracts)

契约规定了函数或表达式在运行时的行为的职责和保障。它表现为一组规则，这些规则是对函数或表达式的输入和输出的期望。当违反契约时，将抛出一个错误。

```js
// 定义的contract: int -> boolean
const contract = (input) => {
  if (typeof input === 'number') return true
  throw new Error('Contract Violated: expected int -> int')
}

const addOne = (num) => contract(num) && num + 1

addOne(2) // 3
addOne('hello') // 违反了contract: int -> boolean
```

## 范畴 (Category)

在范畴论中，范畴是指对象集合及它们之间的态射 (morphism)。在编程中，数据类型作为对象，函数作为态射。

一个有效的范畴遵从以下三个原则：

必有一个同一态射（identity morphism）将一个对象映射到它自身。即当 a 是范畴里的一个对象时，必有一个函数使 a -> a。
态射必是可组合的。a，b，c 是范畴里的对象，f 是态射 a -> b，g 是 b -> c 态射。g(f(x)) 一定与 (g • f)(x) 是等价的。
组合满足结合律。f • (g • h) 与 (f • g) • h 是等价的。
由于这些准则是在非常抽象的层面控制着组合方式，因此范畴论对于发现组合的新方法来说是伟大的。

## 函子 (Functor)

函子是一个实现了 map 函数的对象。map 函数会遍历对象中的每个值并生成一个新的对象，遵守两个准则

>一致性  
> object.map(x => x)  = object  
>组合性  

```js
object.map(compose(f, g)) = object.map(g).map(f)  // f, g 为任意函数
```

在 javascript 中一个常见的函子是 Array, 因为它遵守因子的两个准则。

```js
const f = x => x + 1
const g = x => x * 2

;[1, 2, 3].map(x => f(g(x)))
;[1, 2, 3].map(g).map(f)
```

## 指向函子 (Pointed Functor)

一个对象，拥有一个of函数，可以将一个任何值放入它自身。

ES2015 添加了 Array.of，使 Array 成为了 Pointed Functor。

```js
//of通过可变数量的参数创建一个新的 Array 实例，而不考虑参数的数量或类型。
Array.of(1) // [1]
```

## 抬升 (Lift)

抬升是指将一个值放进一个对象（如函子）中。如果你将一个函数抬升到一个应用函子中，那么就可以将它作用于该函子中的值。

```js
const liftA2 = (f) => (a, b) => a.map(f).ap(b) // 注意这里是 ap 而不是 map.

const mult = a => b => a * b

const liftedMult = liftA2(mult) // 这个函数现在可以作用于函子，如Array

liftedMult([1, 2], [3]) // [3, 6]
liftA2(a => b => a + b)([1, 2], [3, 4]) // [4, 5, 5, 6]
```

## 引用透明性 (Referential Transparency)

如果一个表达式能够被它的值替代而不改变程序的行为，则它是引用透明的。

例如我们有 greet 函数：

```js
const greet = () => 'hello, world.'
```

任何对 greet() 的调用都可以被替换为 Hello World!, 因此 greet 是引用透明的。

## 等式推理 (Equational Reasoning)

当一个应用程序由表达式组成并且没有副作用时，我们可以从这些组成部分中得知系统的真相。

## Lambda

一种可以被视作一个值的匿名函数。
Lambda 通常作为参数被传递给高阶函数。

```js
[1, 2].map((a) => a + 1)

可以把 Lambda 赋值给一个变量。
const add1 = (a) => a + 1
```

## 惰性求值 (Lazy evaluation)

惰性求值是一种按需调用的求值机制，它将表达式的求值延迟到需要它的值为止，在函数式语言中，允许类似无限列表这样的结构存在，而这在非常重视命令顺序的命令式语言中通常是不可用的。

```js
const rand = function* () {
  while (true) {
    yield Math.random()  
  } 
}

const randIter = rand()
randIter.next() // 每次执行产生一个随机值，表达式会在需要时求值。
```

## 闭包  

访问作用域外变量的一种方式,实现了变量的私有化
会捕获函数的外部变量，因此即使执行过程已经移出了定义它的那个代码块，也可以访问它们。也就是说，它们允许在声明变量的代码块已经执行完成之后，还是可以引用这个作用域。

```js
const fun = x => y => x + y
const bb = fun(5) // x = 5, 后续使用bb函数时都会调用固定参数x
bb(3) // 8
```

## 偏函数应用 (Partial Application)

预设原始函数的部分参数来创建一个新的函数。

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

把两个函数放在一起形成第三个函数的行为，一个函数的输入为另一个函数的输出。

```js
const compose = (f, g) => (a) => f(g(a))    // 定义
const floorAndToString = compose((val) => val.toString(), Math.floor) // 使用
floorAndToString(12.12)   // '12'
```
