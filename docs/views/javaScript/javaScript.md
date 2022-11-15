# javaScript 学习

本笔记仅只是本人自学记录所写, 不适合零基础小白阅读
自学网站推荐

1. [MDN](https://developer.mozilla.org/zh-CN/)
2. [菜鸟教程](https://www.runoob.com/)
3. [freecode](https://www.freecodecamp.org/)
4. [掘金](https://juejin.cn/)

## 基础

javaScript 是区分大小写的，并使用 Unicode 字符集,的弱类型语言

### 变量声明

```js
let a = "abc";

var b = 123;

const s = 322;
```

三种变量声明的区别:

> `var` 声明是全局作用域或函数作用域，而 `let` 和 `const` 是块作用域
> var 变量可以在其范围内更新和重新声明； let 变量可以被更新但不能重新声明； const 变量既不能更新也不能重新声明。

> 暂时性死区

从一个代码块的开始直到代码执行到声明变量的行之前，let 或 const 声明的变量都处于“暂时性死区”（Temporal dead zone，TDZ）中
当变量处于暂时性死区之中时，其尚未被初始化，尝试访问变量将抛出 ReferenceError

```js
console.log(typeof value);
let value = "前端人";
```

上面代码中 typeof 检测的值还在暂时性死区中,所以报错

```js
console.log(typeof value); // "undefined"
if (true) {
  let value = "前端人";
}
```

上面代码中 let 声明的 value 暂时性死区只在 if 范围内,所以 typeof 检测的 value 只是一个同名未声明的变量

### Data URLs

**Data URLs**，即前缀为 `data:` 协议的 URL，其允许内容创建者向文档中嵌入小文件

Data URLs 由四个部分组成：前缀 (`data:`)、指示数据类型的 MIME 类型、如果非文本则为可选的`base64`标记、数据本身

```javascript
data:[<mediatype>][;base64],<data>

```

base64 数据转换

atob() 和 btoa()

### 二进制数据 ArrayBuffer,文件

**ArrayBuffer** 对象用来表示通用的、固定长度的原始二进制数据缓冲区,它是一个字节数组

不能直接操作 `ArrayBuffer` 的内容，而是要通过[类型数组对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)或 [`DataView`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/DataView) 对象来操作，它们会将缓冲区中的数据表示为特定的格式，并通过这些格式来读写缓冲区的内容。

> **`ArrayBuffer` 不是某种东西的数组**

让我们先澄清一个可能的误区。`ArrayBuffer` 与 `Array` 没有任何共同之处：

- 它的长度是固定的，我们无法增加或减少它的长度。
- 它正好占用了内存中的那么多空间。
- 要访问单个字节，需要另一个“视图”对象，而不是 `buffer[index]`。

`ArrayBuffer` 是核心对象，是所有的基础，是原始的二进制数据。

但是，如果我们要写入值或遍历它，基本上几乎所有操作 —— 我们必须使用视图（view）

- **Uint8Array** —— 将 `ArrayBuffer` 中的每个字节视为 0 到 255 之间的单个数字（每个字节是 8 位，因此只能容纳那么多）。这称为 “8 位无符号整数”。
- **Uint16Array** —— 将每 2 个字节视为一个 0 到 65535 之间的整数。这称为 “16 位无符号整数”。
- **Uint32Array** —— 将每 4 个字节视为一个 0 到 4294967295 之间的整数。这称为 “32 位无符号整数”。
- **Float64Array** —— 将每 8 个字节视为一个 `5.0x10-324` 到 `1.8x10308` 之间的浮点数。

```javascript
let buffer = new ArrayBuffer(16); // 创建一个长度为 16 的 buffer

let view = new Uint32Array(buffer); // 将 buffer 视为一个 32 位整数的序列

console.log(Uint32Array.BYTES_PER_ELEMENT); // 每个整数 4 个字节

console.log(view.length); // 4，它存储了 4 个整数
console.log(view.byteLength); // 16，字节中的大小

// 让我们写入一个值
view[0] = 123456;

// 遍历值
for (let num of view) {
  console.log(num); // 123456，然后 0，0，0（一共 4 个值）
}
```

### 事件

#### 事件流

![Graphical representation of an event dispatched in a DOM tree using the DOM event flow](https://www.w3.org/TR/DOM-Level-3-Events/images/eventflow.svg)

`queue.waitForMessage()` 会同步地等待消息到达 (如果当前没有任何消息等待被处理)。

```javascript
while (queue.waitForMessage()) {
  queue.processNextMessage();
}
```

在浏览器里，每当一个事件发生并且有一个事件监听器绑定在该事件上时，一个消息就会被添加进消息队列。如果没有事件监听器，这个事件将会丢失。所以当一个带有点击事件处理器的元素被点击时，就会像其他事件一样产生一个类似的消息

函数 [`setTimeout`](https://developer.mozilla.org/zh-CN/docs/Web/API/setTimeout) 接受两个参数：待加入队列的消息和一个时间值（可选，默认为 0）。这个时间值代表了消息被实际加入到队列的最小延迟时间。如果队列中没有其它消息并且栈为空，在这段延迟时间过去之后，消息会被马上处理。但是，如果有其它消息，`setTimeout` 消息必须等待其它消息处理完。因此第二个参数仅仅表示最少延迟时间，而非确切的等待时间

#### 事件委托

事件委托 就是 如果有很多元素要写事件监听(也就是事件处理程序)，那么可以给所有元素的共同父元素添加一个事件处理程序, 然后因为事件冒泡流的存在, 在子元素上触发的事件最终会传递给父元素，所以在父元素上也可以监听到在子元素上触发的事件，从而提高页面效率

#### 事件循环

![Stack, heap, queue](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop/the_javascript_runtime_environment_example.svg)

事件按照先后顺序逐一添加到事件队列 queue 中,秉承着先进先出的原则

#### 阻止事件默认行为

```javascript
event.preventDefault(): 取消事件
event.cancelable: 事件是否可取消

event.stopPropagation() 阻止事件传播
event.stopImmediatePropagation 阻止监听同一事件的其他事件监听器被调用
```

### async 与 defer 区别

![async 与 defer 区别](/images/asyncdefer.svg)
在*正常情况下*，即 `<script>` 没有任何额外属性标记的情况下，有几点共识

1. JS 的脚本分为**加载、解析、执行**几个步骤，简单对应到图中就是 `fetch` (加载) 和 `execution` (解析并执行)
2. **JS 的脚本加载(fetch)且执行(execution)会阻塞 DOM 的渲染**，因此 JS 一般放到最后头

而 `defer` 与 `async` 的区别如下:

- 相同点: **异步加载 (fetch)**
- 不同点:
  - async 加载(fetch)完成后立即执行 (execution)，因此可能会阻塞 DOM 解析；
  - defer 加载(fetch)完成后延迟到 DOM 解析完成后才会执行(execution)\*\*，但会在事件 `DomContentLoaded` 之前

### 定义一个支持过期的 localstorage

通过重写 localStorage 的 setItem 和 getItem 方法可以实现

```javascript
function initLocalStorage() {
  localStorage.setItem = function (key, value, time = 1000) {
    const expiresTime = Date.now() + time * 1000;
    const payload = {
      __data: value,
      __expiresTime: expiresTime,
    };
    Storage.prototype.setItem.call(localStorage, key, JSON.stringify(payload));
  };
  localStorage.getItem = function (key) {
    const value = Storage.prototype.getItem.call(localStorage, key);
    if (typeof value === "string") {
      const jsonVal = JSON.parse(value);
      if (jsonVal.__expiresTime) {
        if (jsonVal.__expiresTime >= Date.now()) {
          return JSON.stringify(jsonVal.__data);
        } else {
          return null;
        }
      }
    }
    return value;
  };
}
initLocalStorage();
```

通过在重写的 setItem 方法内修改对象的值达到监听 localStorage 修改的目的

```javascript
var obj = {
  off: 0,
};
Object.defineProperty(obj, "off", {
  enumerable: true,
  set(v) {
    console.log("localStorage改变了");
  },
});
localStorage.setItem = function (key, value, time = 1000) {
  const expiresTime = Date.now() + time * 1000;
  const payload = {
    __data: value,
    __expiresTime: expiresTime,
  };
  obj.off += 1;
  Storage.prototype.setItem.call(localStorage, key, JSON.stringify(payload));
};
```

### npm 镜像

```javascript
//淘宝镜像
https://registry.npmmirror.com/
// 官方镜像
https://registry.npmjs.org/
// 设置
npm config set registry https://registry.npmjs.org
```

### HTTP 协议

| **分类** | **分类描述**                                                                          |
| -------- | ------------------------------------------------------------------------------------- |
| 1\*\*    | 信息，服务器收到请求，需要请求者继续执行操作（实际开发中很少遇到 1\*\* 类型的状态码） |
| 2\*\*    | 成功，操作被成功接收并处理                                                            |
| 3\*\*    | 重定向，需要进一步的操作以完成请求                                                    |
| 4\*\*    | 客户端错误，请求包含语法错误或无法完成请求                                            |
| 5\*\*    | 服务器错误，服务器在处理请求的过程中发生了错误                                        |

| **状态码** | **状态码英文名称** | **中文描述**                                                                                             |
| ---------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| 400        | Bad Request        | 1、语义有误，当前请求无法被服务器理解。除非进行修改，否则客户端不应该重复提交这个请求。2、请求参数有误。 |
| 401        | Unauthorized       | 当前请求需要用户验证。                                                                                   |
| 403        | Forbidden          | 服务器已经理解请求，但是拒绝执行它。                                                                     |
| 404        | Not Found          | 服务器无法根据客户端的请求找到资源（网页）。                                                             |
| 408        | Request Timeout    | 请求超时。服务器等待客户端发送的请求时间过长，超时。                                                     |

### new 过程

1. 创建一个空的简单 JavaScript 对象（即`**{}**`）；
2. 为步骤 1 新创建的对象添加属性`**__proto__**`，将该属性链接至构造函数的原型对象 ；
3. 将步骤 1 新创建的对象作为`**this**`的上下文 ；
4. 如果该函数没有返回对象，则返回`**this**`。

```javascript
function TestObj(num) {
  this.num = num;
}
function newFun(cont, ...args) {
  //cont是构造函数，args是构造函数的所需参数
  // 新建一个对象，new出来返回的就是这个
  let obj = Object.create(cont.prototype);
  // 给这个对象指定原型链，构造函数有什么，obj也会有

  let result = cont.apply(obj, args);
  //运行构造函数，把构造函数的参数挂到obj上，注意是obj
  //
  return result instanceof Object ? result : obj;
}
const test1 = newFun(TestObj, 1);
```

### Object

#### 1.Object.defineProperty

直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回此对象

```javascript
Object.defineProperty(object1, "property1", {
  configurable: true, // 属性是否能删除,且能否修改描述对象的属性
  enumerable: true, //  属性是否能枚举
  value: undefined, // 属性对应的值
  writable: true, // 能否改变value的值
  get: undefined, // 获取属性时会调用此方法,返回值会用作属性的值
  set(newValue) {}, // 属性值被修改时会调用此方法
});
```

不能同时指定 writable 和 get,set 函数一起使用

get 和 set 函数中的 this 由于继承关系，并不一定是定义该属性的对象

比如 再原型上生明一个属性,实例化对象调用这个属性,则 this 指向实例化对象,而不是原型

### requestAnimationFrame 页面更新

浏览器在下次重绘之前调用指定的回调函数

### XMLHttpRequest 发送网络请求

```javascript
// get请求
var request = new XMLHttpRequest();
// 设置 超时时间
request.timeout = 600;
request.addEventListener("load", reqListener);
request.open("GET", "http://www.liulongbin.top:3006/api/getbooks?id=1");
request.send();
// onreadystatechange 根据readyState 属性变化执行回调函数
request.onreadystatechange = function () {
  // 获取服务器响应的数据
  console.log(request);
};
// 等待响应
request.addEventListener("load", function () {
  console.log(request);
});
// post请求
var xhr = new XMLHttpRequest();
// 2. 调用 open 函数
xhr.open("POST", "http://www.liulongbin.top:3006/api/addbook");
// 3. 设置 Content-Type 属性
xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
// 4. 调用 send 函数
xhr.send("bookname=水浒传&author=施耐庵&publisher=上海图书出版社");
// 5. 监听事件
xhr.onreadystatechange = function () {
  if (xhr.readyState === 4 && xhr.status === 200) {
    console.log(xhr.responseText);
  }
};
// 发送json数据
xhr.setRequestHeader("Content-Type", "application/json");
xhr.send(JSON.stringify({ error_url: location.href }));

// 发送表单数据
// 1. 创建 FormData 实例
var fd = new FormData();
// 2. 调用 append 函数，向 fd 中追加数据
fd.append("uname", "zs");
fd.append("upwd", "123456");

var xhr = new XMLHttpRequest();
xhr.open("POST", "http://www.liulongbin.top:3006/api/formdata");
xhr.send(fd);

xhr.onreadystatechange = function () {
  if (xhr.readyState === 4 && xhr.status === 200) {
    console.log(JSON.parse(xhr.responseText));
  }
};
```

### 文件上传

```html
<body>
  <!-- 1. 文件选择框 -->
  <input type="file" id="file1" />
  <!-- 2. 上传文件的按钮 -->
  <button id="btnUpload">上传文件</button>
  <br />
  <!-- 3. img 标签，来显示上传成功以后的图片 -->
  <img src="" alt="" id="img" width="800" />
  <!-- bootstrap 中的进度条 -->
  <div class="progress" style="width: 500px; margin: 15px 10px;">
    <div
      class="progress-bar progress-bar-striped active"
      style="width: 0%"
      id="percent"
    >
      0%
    </div>
  </div>
  <script>
    // 1. 获取到文件上传按钮
    var btnUpload = document.querySelector("#btnUpload");
    // 2. 为按钮绑定单击事件处理函数
    btnUpload.addEventListener("click", function () {
      // 3. 获取到用户选择的文件列表
      var files = document.querySelector("#file1").files;
      console.log(files);
      if (files.length <= 0) {
        return alert("请选择要上传的文件！");
      }
      var fd = new FormData();
      // 将用户选择的文件，添加到 FormData 中
      fd.append("avatar", files[0]);

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "http://www.liulongbin.top:3006/api/upload/avatar");
      xhr.send(fd);

      // 监听文件上传的进度
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          // 计算出上传的进度
          var procentComplete = Math.ceil((e.loaded / e.total) * 100);
          console.log(procentComplete);
          // 动态设置进度条
          $("#percent")
            .attr("style", "width: " + procentComplete + "%;")
            .html(procentComplete + "%");
        }
      };

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          if (data.status === 200) {
            // 上传成功
            document.querySelector("#img").src =
              "http://www.liulongbin.top:3006" + data.url;
          } else {
            // 上传失败
            console.log("图片上传失败！" + data.message);
          }
        }
      };
    });
  </script>
</body>
```

### 数组

### 字符串

### Promise

[`Promise`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise) 是一个对象，它代表了一个异步操作的最终完成或者失败

> 约定注意

- 在本轮 [事件循环](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop#执行至完成) 运行完成之前，回调函数是不会被调用的。
- 即使异步操作已经完成（成功或失败），在这之后通过 [`then()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) 添加的回调函数也会被调用。
- 通过多次调用 [`then()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then) 可以添加多个回调函数，它们会按照插入顺序进行执行

> 状态

- _待定（pending）_：初始状态，既没有被兑现，也没有被拒绝。
- _已兑现（fulfilled）_：意味着操作成功完成。
- _已拒绝（rejected）_：意味着操作失败。
- 当前 Promise 状态一经确定就不能更改了

> 死循环情况

如果 Promise.resolve 传入的参数带有 then 方法,则最终返回的 promise 状态会跟随参数的最终状态而定

不要在解析为自身的 thenable 上调用`Promise.resolve`。这将导致无限递归，因为它试图展平无限嵌套的 promise
例子:

```javascript
let thenable = {
  then: (resolve, reject) => {
    resolve(thenable);
  },
};

Promise.resolve(thenable);
// 等价于
new Promise((resolve, reject) => {
  resolve(thenable);
});
```

1. 调用栈生成 thenable 对象 作为 Promise.resolve 的实参
2. 执行 Promise.resolve(thenable), 将 thenable 的 then 放入微任务队列

`链式调用`

后一个调用要等前面的先执行,同步的微任务调用要优先于链式调用

```js
Promise.resolve(1)
  .then((res) => {
    console.log(res);
    return 2;
  })
  .then((res) => {
    console.log(res);
  });

Promise.resolve("ok")
  .then((res) => {
    console.log(res);
    return res + 1;
  })
  .then((res) => {
    console.log(res);
  });
// 这里的打印顺序为
// 1
// ok
// 2
// ok1
```

#### .then() 和 .catch() 和.finally()

只有在 promise 状态为成功或者拒绝才会触发

参数中回调任务是排在微任务队列中处理

返回的是一个新的 promise 对象

`finally`除非回调函数内抛出异常,否则返回的结果默认是上一个 Promise 对象的值

.catch()默认返回一个成功(resolved)状态的 Promise,触发在回调中抛出异常或者返回一个失败的 Promise

```javascript
const promise = new Promise((resolve, reject) => {
  reject("error");
  resolve("success2");
});
promise
  .then((res) => {
    console.log("then1: ", res);
  })
  .catch((err) => {
    console.log("catch: ", err);
  })
  .then((res) => {
    console.log("then3: ", res);
  });
```

`.then` 或 `.catch` 返回的值不能是 promise 本身，否则会造成死循环

`.then` 或者 `.catch` 的参数期望是函数，传入非函数则会发生值透传(直接放弃当前参数)

```js
Promise.resolve(1)
  .then(2) // 返回调用then的Promise
  .then(Promise.resolve(3)) // 返回调用then的Promise
  .then(console.log);
```

`.then` 或者 `.catch` 中 `return` 一个 `error` 对象并不会抛出错误，所以不会被后续的 `.catch` 捕获(需要使用**throw**抛出)

```javascript
var p1 = new Promise((resolve, reject) => {
  resolve("成功！");
});

let a1 = p1.then(
  (value) => {
    console.log(value); // 成功！
  },
  (reason) => {
    console.error(reason); // 出错了！
  }
);
console.log(a1);
```

顺序执行,可以通过 new 一个新的 Promise 返回一个 pending 状态的 Promise,实现 Promise 操作的顺序执行

```js
Promise.resolve().then((x) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(x);
    }, 1000);
  });
});

const arr = [1, 2, 3];
arr.reduce(
  (p, x) =>
    p.then(() => new Promise((r) => setTimeout(() => r(console.log(x)), 1000))),
  Promise.resolve()
);
```

then 回调函数返回值不同结果:

- 返回了一个值，那么 `then` 返回的 Promise 将会成为接受状态，并且将返回的值作为接受状态的回调函数的参数值

```javascript
let a1 = p1.then((value) => {
  return "1";
});
a1.then((val) => {
  console.log(val); // '1'
});
```

- 没有返回任何值，那么 `then` 返回的 Promise 将会成为接受状态，并且该接受状态的回调函数的参数值为 `undefined`
- 抛出一个错误，那么 `then` 返回的 Promise 将会成为拒绝状态，并且将抛出的错误作为拒绝状态的回调函数的参数值。

#### all

接收一组异步任务，然后并行执行异步任务，并且在所有异步操作执行完后才执行回调

正常使用

```js
const promise1 = Promise.resolve(3);
const promise2 = 42;
const promise3 = new Promise((resolve, reject) => {
  setTimeout(resolve("foo"), 100);
});

Promise.all([promise1, promise2, promise3]).then((values) => {
  console.log(values); // [3, 42, "foo"]
});
```

异常使用

```js
function runAsync(x) {
  const p = new Promise((r) => setTimeout(() => r(x, console.log(x)), 1000));
  return p;
}
function runReject(x) {
  const p = new Promise((res, rej) =>
    setTimeout(() => rej(`Error: ${x}`, console.log(x)), 1000 * x)
  );
  return p;
}
Promise.all([runAsync(1), runReject(4), runAsync(3), runReject(2)])
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
```

### async/await

async 和 await 关键字声明的函数是一种基于 Promise 的异步行为,简化 Promise 操作

await 中的同步代码正常执行, 其后的代码被阻塞,进入微任务队列

```js
async function async1() {
  console.log(0);
  await async2();
  console.log(3);
}
async function async2() {
  console.log(1);
}
async1();
console.log(4);

// 输出结果
// 0
// 1
// 4
// 3
```

async 声明的函数的返回值是一个 Promise 对象(根据函数内部 return 的结果进行包装),所以返回值可以进行 then 操作

#### FAQ

await 后面语句返回的 Promise 处于 pending 状态,所以其后的同步代码不会执行

```JS
async function async1 () {
  console.log('async1 start');
  await new Promise(resolve => {
    console.log('promise1')
  })
  console.log('async1 success');
  return 'async1 end'
}
console.log('srcipt start')
async1().then(res => console.log(res))
console.log('srcipt end')

```

### 正则表达式

```javascript
// 正数,非零开头,字母e
/(^-+)|(^[0]+)|(e+)/g;
```

## this 问题

在绝大多数情况下，函数的调用方式决定了 `this` 的值（运行时绑定）.这里可以理解为 this 是动态绑定的

默认情况下函数的 this 指向函数的调用者,当然也有例外,比如 apply 函数和 call 函数

在 class 中,通过实例调用普通函数或箭头函数的 this 都是指向实例化对象,

通过引用调用的函数 this 指向是 undefined

箭头函数不会创建自己的`this，它只会从自己的作用域链的上一层继承 this`

```js
function Person() {
  this.age = 0;

  setInterval(() => {
    this.age++; // |this| 正确地指向 p 实例
  }, 1000);
}

var p = new Person();
```

## 实现 bind 方法

```js
Function.prototype.fakeBind = function (_this, ...arg) {
  return (...res) => this.call(_this, ...arg, ...res);
};

//测试
function f(arg) {
  console.log(this.a, arg);
}

// output: 3, 4
f.bind({ a: 3 })(4);

// output: 3, 4
f.fakeBind({ a: 3 })(4);

// 实现softbind(已最后一次绑定的this调用函数)
Function.prototype.softBind = function (obj, ...rest) {
  const fn = this;
  const bound = function (...args) {
    const o = !this || this === (window || global) ? obj : this;
    return fn.apply(o, [...rest, ...args]);
  };

  bound.prototype = Object.create(fn.prototype);
  return bound;
};
let obj = { name: "obj" };
obj2 = { name: "obj2" };
obj3 = { name: "obj3" };

let fooBJ = foo.softBind(obj);
fooBJ(); // name: obj   这个时候软绑定已经生效了，this绑定到obj上
obj2.foo = foo.softBind(obj);
obj2.foo(); //name: obj2   这里已经的this隐式绑定到obj2上了
fooBJ.call(obj3); // name: obj3  这里this被硬绑定到obj3上了
setTimeout(obj2.foo, 100); // name: obj  软绑定了最初的obj
```

## 原型与原型链

![Image](D:\codeWork\images\yx.jpg)

构造函数 或者 class 通过实例化生成实例对象

实例的**proto**属性指向实例的原型对象

构造函数的 prototype 指向实例的原型对象

es6 的 class 本质就是函数

```javascript
class PromiseDemo {
  name = "";
  constructor() {
    console.log("构造函数");
  }
}
function Demo(params) {
  this.name = "Demo";
  return this;
}
let obj = new PromiseDemo();
let obj1 = new Demo();
console.log(obj.__proto__ === PromiseDemo.prototype); // true
console.log(typeof PromiseDemo); // 'function'
```

## 事件循环

堆,栈,webAPIs, 回调队列(微任务队列)

![event-loop](D:\codeWork\images\event-loop.png)

如上图为事件循环示例图（或 JS 运行机制图），流程如下：

step1：主线程读取 JS 代码，此时为同步环境，形成相应的堆和执行栈；

step2: 主线程遇到异步任务，指给对应的异步进程进行处理（WEB API）;

step3: 异步进程处理完毕（Ajax 返回、DOM 事件处罚、Timer 到等），将相应的异步任务推入任务队列(宏任务和微任务)；

step4: 主线程执行完毕，查询任务队列，如果存在任务，则取出一个任务推入主线程处理（先进先出）；

step5: 重复执行 step2、3、4；称为事件循环。

执行的大意：

同步环境执行(step1) -> 事件循环 1(step4) -> 事件循环 2(step4 的重复)…

其中的异步进程有：

a、类似 onclick 等，由浏览器内核的 DOM binding 模块处理，事件触发时，回调函数添加到任务队列中；

b、setTimeout 等，由浏览器内核的 Timer 模块处理，时间到达时，回调函数添加到任务队列中；

c、Ajax，由浏览器内核的 Network 模块处理，网络请求返回后，添加到任务队列中

## 宏任务 && 微任务 && JS 运行时环境

### [JavaScript 执行上下文](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth#javascript_执行上下文)

当一段 JavaScript 代码在运行的时候，它实际上是运行在**执行上下文**中,每个上下文创建的时候会被推入**执行上下文栈**。当退出的时候，它会从上下文栈中移除.

关于递归函数——即多次调用自身的函数，需要特别注意：每次递归调用自身都会创建一个新的上下文。这使得 JavaScript 运行时能够追踪递归的层级以及从递归中得到的返回值，但这也意味着每次递归都会消耗内存来创建新的上下文

创建执行上下文

- 全局上下文是为运行代码主体而创建的执行上下文，也就是说它是为那些存在于 JavaScript 函数之外的任何代码而创建的。
- 每个函数会在执行的时候创建自己的执行上下文。这个上下文就是通常说的 “本地上下文”。
- 使用 [`eval()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/eval) 函数也会创建一个新的执行上下文。

```javascript
let fn, bar; // 1、进入全局上下文环境
bar = function (x) {
  let b = 5;
  fn(x + b); // 3、进入fn函数上下文环境
};
fn = function (y) {
  let c = 5;
  console.log(y + c); //4、fn出栈，bar出栈
};
bar(10); // 2、进入bar函数上下文环境
```

![img](\images\js_sx.png)

### 宏任务 与 微任务

![](D:\codeWork\images\event-loop.webp)

个人理解的前端事件循环,任务处理流程:

1. script 代码加载完,执行全局宏任务
2. 任务进入调用栈,执行代码
3. 将回调函数和异步操作暂存计划列表
4. 计划任务入队
5. 优先执行 Task queue(俗称微任务),这也是为什么 Promise 比 setTimeout 快的原因
6. 事件循环监听 Job Queue 中是否有任务
7. 开始下一轮宏任务

一个**任务**就是指计划由标准机制来执行的任何 JavaScript，如程序的初始化、事件触发的回调等。 除了使用事件，你还可以使用 [`setTimeout()`](https://developer.mozilla.org/zh-CN/docs/Web/API/setTimeout) 或者 [`setInterval()`](https://developer.mozilla.org/zh-CN/docs/Web/API/setInterval) 来添加任务

任务队列和微任务队列的区别很简单，但却很重要：

- 当执行来自任务队列中的任务时，在每一次新的事件循环开始迭代的时候运行时都会执行队列中的每个任务。在每次迭代开始之后加入到队列中的任务需要**在下一次迭代开始之后才会被执行**.
- 每次当一个任务退出且执行上下文为空的时候，微任务队列中的每一个微任务会依次被执行。不同的是它会等到微任务队列为空才会停止执行——即使中途有微任务加入。换句话说，微任务可以添加新的微任务到队列中，并在下一个任务开始执行之前且当前事件循环结束之前执行完所有的微任务。

  1.先执行宏任务(中途添加的宏任务,安排到下次事件循环中)

  2.宏任务执行完毕,检查微任务队列,有则立即执行

  3.开启下一轮事件循环,执行宏任务

## [Web Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Using_web_workers#%E6%9B%B4%E5%A4%9A%E7%A4%BA%E4%BE%8B)

一个 worker 是使用一个构造函数创建的一个对象 (e.g. [`Worker()`](https://developer.mozilla.org/zh-CN/docs/Web/API/Worker/Worker)) 运行一个命名的 JavaScript 文件 - 这个文件包含将在工作线程中运行的代码; workers 运行在另一个全局上下文中，不同于当前的[`window`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window). 因此，在 [`Worker`](https://developer.mozilla.org/zh-CN/docs/Web/API/Worker) 内通过 [`window`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window)获取全局作用域 (而不是[`self`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/self)) 将返回错误.(`注意,js文件要考虑跨域问题`)

在 worker 内，不能直接操作 DOM 节点，也不能使用[`window`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window)对象的默认方法和属性

workers 和主线程间的数据传递通过使用 postMessage() 方法发送各自的消息，使用 onmessage 事件处理函数来响应消息（消息被包含在`Message`事件的 data 属性中）。这个过程中数据并不是被共享而是被复制。

## FAQ

### vite 图片资源处理

1.项目引入本地图片通过 new URL(url, import.meta.url)方式

```javascript
// 打包后资源会找不到
function getImageUrl(url) {
  return new URL(url, import.meta.url).href;
}
// 官方声明这里的url必须是静态的才能打包后正常使用
```

2. 直接将资源放入 public 目录内,直接使用/开头绝对路径
3. 通过 import 引入图片后再使用

### HTML 实体编码

- 不可分的空格:＆nbsp;
- <(小于符号):＆lt;
- (大于符号):＆gt;
- ＆(与符号):＆amp;
- ″(双引号):＆quot;
- '(单引号):'＆apos;

### 子元素 click 事件为什么不执行

<https://codepen.io/lancelovejava/pen/dymVZYN>

```javascript
pointer-events: none;
//值none表示鼠标事件“穿透”该元素并且指定该元素“下面”的任何东西。
```

### textarea 高度自适应

```css
textarea {
  width: 100%;
  height: 80px;
  overflow: hidden;
  border: none;
  resize: none;
}
```

```js
let textList = Array.from(document.getElementsByTagName('textarea'));
  textList.forEach((ele) => {
    ele.addEventListener('input', (e) => {
      let el = e.target as HTMLElement;
      el.style.height = `${el.scrollHeight}px`;
    });
  });
```

### Data URL 注意

使用 Data URL 也有一些缺点：

- base64 编码后的图片会比原来的体积大三分之一左右。
- Data URL 形式的图片不会缓存下来，每次访问页面都要被下载一次。可以将 Data URL 写入到 CSS 文件中随着 CSS 被缓存下来。

Data URL 是前缀为`data:`协议的 URL； 它允许内容创建者向文档中嵌入小文件，比如图片等。 Data URL 由四部分组成：

- 前缀`data:`
- 指示数据类型的 MIME 类型。例如`image/jpeg`表示 JPEG 图像文件；如果此部分被省略，则默认值为`text/plain;charset=US-SACII`
- 如果为非文本数据，则可选 base64 做标记
- 数据

### JSON 中 stringify 输出注意

```
const obj = {
  a: 3,
  b: 4,
  c: null,
  d: undefined,
  get e() {},
};
console.log(JSON.stringify(obj));
// {"a":3,"b":4,"c":null,"e":111}
```

stringify 函数处理对象时,值是 undefined 的 key 被抛弃,get e() 未有返回值所以是 undefined

## 跨域

**协议**，**域名**，**端口**，三者有一不一样，就是跨域

解决方案:

1. CORS，在服务器端设置几个响应头，如 `Access-Control-Allow-Origin: *`
2. Reverse Proxy，在 nginx/traefik/haproxy 等反向代理服务器中设置为同一域名
3. JSONP，详解见 [JSONP 的原理是什么，如何实现](https://github.com/shfshanyue/Daily-Question/issues/447)

JSONP (JSON with Padding) 是 JSON 的一种“使用模式”，可用于解决主流浏览器的跨域数据访问的问题。

原理:通过 script 标签的 src 属性，请求跨域的数据接口，并通过函数调用的形式，接收跨域接口响应回来的数据。

注意: 只限于 get 请求

```javascript
 <script>
   function success(data) {
     console.log('获取到了data数据：')
     console.log(data)
   }
 </script>

<script src="http://ajax.frontend.itheima.net:3006/api/jsonp?callback=success&name=zs&age=20"></script>

```

## 常用 API

```javascript
// 获取元素位置信息
Element.getBoundingClientRect()
// 元素查找方法
Element.querySelector()
Element.querySelectorAll()
Element.getElementsByTagName()
Element.getElementsByClassName()
// 事件方法
Element.addEventListener()：添加事件的回调函数
Element.removeEventListener()：移除事件监听函数
Element.dispatchEvent()：触发事件
// 滚动元素,进入浏览器的可见区域
Element.scrollIntoView()
//解析HTML字符串，然后将生成的节点插入DOM树的指定位置。
Element.insertAdjacentHTML(position, htmlString);
//用于将当前元素节点从DOM中移除
Element.remove()
//用于将当前页面的焦点，转移到指定元素上
Element.focus()
//判断是否有某个类名
function hasClass(element,className){
  return new RegExp(className,'gi').test(element.className);
}
//移除class
function removeClass(element,className){
  element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'),'');
}

Object.keys(o)   //遍历对象的属性
Object.getOwnPropertyName(o)   //遍历对象属性(包含不可枚举属性)
valueOf()：返回当前对象对应的值。
toString()：返回当前对象对应的字符串形式。
toLocaleString()：返回当前对象对应的本地字符串形式。
hasOwnProperty()：判断某个属性是否为当前对象自身的属性，还是继承自原型对象的属性。
isPrototypeOf()：判断当前对象是否为另一个对象的原型。
propertyIsEnumerable()：判断某个属性是否可枚举。
//返回指定对象的原型
Object.getPrototypeOf()
//直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回此对象
Object.defineProperty()
```

## ES6 学习

### let 和 const

let,const

1. 不存在变量提升
2. 暂时性死区
3. 不允许重复声明

`const`实际上保证的，并不是变量的值不得改动，而是变量指向的那个内存地址所保存的数据不得改动

ES6 声明变量的六种方法: var let const import function class

### 解构赋值

#### 函数解构赋值

```javascript
function add([x, y]) {
  return x + y;
}

add([1, 2]); // 3
```

#### 数组解构赋值

```javascript
// 数组 模式匹配
// 如果解构不成功，变量的值就等于undefined
let [a, b, c] = [1, 2, 3];

let [head, ...tail] = [1, 2, 3, 4];
head; // 1
tail; // [2, 3, 4]

let [x, y, ...z] = ["a"];
x; // "a"
y; // undefined
z; // []

// 报错
let [foo] = 1;
let [foo] = false;
let [foo] = NaN;
let [foo] = undefined;
let [foo] = null;
let [foo] = {};
//因为等号右边的值，要么转为对象以后不具备 Iterator 接口（前五个表达式），要么本身就不具备 Iterator 接口（最后一个表达式）
```

### 类 class

```javascript
let methodName = "getArea";
class demo1 {
  // 私有属性, 只能类内部用
  static #count = 0;
  name = "";
  static {
    console.log("类的静态块,类生成时运行,只运行一次");

    console.log(this === demo1);
  }
  constructor() {
    if (new.target !== undefined) {
      this.name = name;
    } else {
      throw new Error("必须使用 new 命令生成实例");
    }
    console.log(demo1.#count);
  }
  [methodName]() {
    console.log("属性表达式");
  }
  static greed() {
    console.log("静态方法");
  }
  red() {
    console.log("非静态方法");
  }
  #red() {
    console.log("私有方法");
  }
  showPrivate() {
    console.log(this.#xp);
    this.#xp = 1;
    console.log(this.#xp);
  }
  get name() {
    return this.name;
  }
  set name(param) {
    this.name = param;
  }
  get #xp() {
    return demo1.#count;
  }
  set #xp(param) {
    demo1.#xp = param;
  }
}
class demo2 extends demo1 {
  static age = 0; // 静态属性
  constructor() {
    super();
  }
  static demoEven() {
    console.log("调用父类静态方法");
    super.greed();
  }
}
const testClass = class demo3 {
  constructor() {
    demo3.name = 1;
  }
};
```

## VUE2

### [响应式原理](https://v2.cn.vuejs.org/v2/guide/reactivity.html)

核心思路:

- 对象: 通过[defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty),将传入 vue 的普通 js 对象,的已有属性转换成 get/set 进行劫持(监视/拦截)

- 数组: 通过重写数组更新数组一系列更新元素的方法来实现元素修改的劫持

由于 JavaScript 的限制，Vue **不能检测**数组和对象的变化

(可以监视通过数组函数修改的数组变化,但是不能监视数组的索引操作的变化,也不检测数组长度变化)

可以监视对象初始属性的变化,对象后期添加/删除的属性变化检测不到

可以使用 set(object, propertyName, value) 方法向嵌套对象添加响应式 property

```js
Vue.set(vm.someObject, "b", 2);
```

由于 Vue 不允许动态添加根级响应式 property，所以你必须在初始化实例前声明所有根级响应式 property，哪怕只是一个空值

```js
var vm = new Vue({
  data: {
    // 声明 message 为一个空值字符串
    message: "",
  },
  template: "<div>{{ message }}</div>",
});
// 之后设置 `message`
vm.message = "Hello!";
```

## Vue3

### 响应式原理

基于 vue2 响应式存在的缺陷:

- 对象属性的添加删除
- 数组元素索引操作/数组.length 操作
- Map,Set,WeakMap 和 WeakSet 数据类型的支持

vue3 响应式基于 proxy 实现

```js
function reactive(obj) {
  return new Proxy(obj, {
    get(targ, key) {
      track(target, key);
      return Reflect.get(targ, key);
    },
    set(targ, key, value) {
      target[key] = value;
      return Reflect.set(targ, key, value);
    },
    delect(targ, key) {
      return Reflect.delectProperty(targ, key);
    },
  });
}
function ref(value) {
  const refObject = {
    get value() {
      track(refObject, "value");
      return value;
    },
    set value(newValue) {
      value = newValue;
      trigger(refObject, "value");
    },
  };
  return refObject;
}
```

watchEffect 的实现,同理 computer 也是一样

```js
const effectStack = []; // 缓存响应式任务
const targetMap = new WeakMap(); // 响应式关系映射表WeakMap<target, Map<key, Set<effect>>>
// 依赖收集
function track(target, key) {
  // 获取响应式函数
  const effect = effectStack[effectStack.length - 1];
  // console.log(effect);
  if (effect) {
    // 获取 target 映射关系 map，不存在则创建
    let depMap = targetMap.get(target);
    if (!depMap) {
      depMap = new Map();
      targetMap.set(target, depMap);
    }
    // 获取 key 对应依赖集合，不存在则创建
    let deps = depMap.get(key);
    if (!deps) {
      deps = new Set();
      depMap.set(key, deps);
    }
    // 将响应函数添加到依赖集合
    deps.add(effect);
  }
}
// 执行effectStack中的任务
function trigger(target, key) {
  const effects = getSubscribersForProperty(target, key);
  effects.forEach((effect) => effect());
}
//
function effect(fn, options = {}) {
  // 创建 reactiveEffect
  const effectRun = createReactiveEffect(fn, options);
  // 执行一次触发依赖收集
  effectRun();
  return effectRun;
}
function createReactiveEffect(fn, options) {
  // 封装一个高阶函数，除了执行fn，还要将自己放入 effectStack 为依赖收集做准备
  const effect = function reactiveEffect(...args) {
    if (!effectStack.includes(effect)) {
      try {
        // 1、effect入栈
        effectStack.push(effect);
        // 2、执行fn
        return fn(...args);
      } finally {
        // 3、effect出栈
        effectStack.pop();
      }
    }
  };
  return effect;
}
function computed(fn) {
  // 创建一个特殊的 effect：
  // 这个effect创建时不会立刻执行，且会在其他effect后面执行
  const runner = effect(fn, {
    computed: true,
    lazy: true,
  });
  // 返回一个对象包含响应函数和最新值的getter
  // 这样computed首次获取值时才收集依赖
  return {
    effect: runner,
    get value() {
      return runner();
    },
  };
}
// 1.先运行watchEffect内部函数
// 2. 函数内部调用effect
// 3. 执行参数函数进行依赖收集,建立响应式映射关系
watchEffect(() => {
  // 追踪 A0 和 A1
  A2.value = A0.value + A1.value;
});
```

### [模板引用](https://cn.vuejs.org/guide/essentials/template-refs.html#accessing-the-refs)

ref 属性: 获取 dom 元素或者子组件实例的模板引用,只有在组件挂载后才能使用

获取子组件的 dom 元素:

```vue
//app.vue
<script setup>
import { ref, onMounted } from "vue";
import comp from "./Comp.vue";
const hh = ref();
onMounted(() => {
  console.log(hh.value.chilDom, 1);
});
</script>

<template>
  <comp ref="hh"></comp>
</template>

// Comp.vue
<template>
  <h1 ref="chilDom">{{ msg }}</h1>
</template>
<script setup>
import { ref } from "vue";

const msg = ref("H1");
const chilDom = ref();
defineExpose({
  chilDom,
});
</script>
```

## React
