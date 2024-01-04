# JS FAQ 问题汇总

## import 导入js , this 为undefined

demo

index.html

```html
<script type="module">
 import './test.js'
</script>
```

test.js

```js
(function(fun) {
  fun()
})(function() {
  console.log(this) // 输出undefined
})
```

静态的 import 语句用于导入由另一个模块导出的绑定。无论是否声明了 strict mode，导入的模块都运行在严格模式下。在浏览器中，import 语句只能在声明了 type="module" 的 script 的标签中使用

严格模式下,执行函数时没有执行主体，因此this指向undefined，非严格模式下的执行主体默认是window，因此this指向window。

## async/await 问题

async 声明的函数的返回值是一个 Promise 对象(根据函数内部 return 的结果进行包装),所以返回值可以进行 then 操作
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

## vite 图片资源处理

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

## HTML 实体编码

- 不可分的空格:＆nbsp;
- <(小于符号):＆lt;
- (大于符号):＆gt;
- ＆(与符号):＆amp;
- ″(双引号):＆quot;
- '(单引号):'＆apos;

## 子元素 click 事件为什么不执行

<https://codepen.io/lancelovejava/pen/dymVZYN>

```javascript
pointer-events: none;
//值none表示鼠标事件“穿透”该元素并且指定该元素“下面”的任何东西。
```

## textarea

高度适应解决方案

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

修改enter为发送,ctrl + enter 为换行

```vue
<el-input
  v-model="inputContent"
  type="textarea"
  :autosize="{ minRows: 2, maxRows: 4}"
  placeholder="请输入内容"
  @keydown.native.enter="handledTextarea"
>
```

```js
handledTextarea (e) {
      e.preventDefault()
      if (e.keyCode === 13) {
        // 判断ctrl 是否按下
        if (e.ctrlKey) {
          console.log('换行')
          this.inputContent += '\n'
        } else {
          console.log('发送')
          this.subMit()
        }
      }
    }
```

## Data URL 注意

使用 Data URL 也有一些缺点：

- base64 编码后的图片会比原来的体积大三分之一左右。
- Data URL 形式的图片不会缓存下来，每次访问页面都要被下载一次。可以将 Data URL 写入到 CSS 文件中随着 CSS 被缓存下来。

Data URL 是前缀为`data:`协议的 URL； 它允许内容创建者向文档中嵌入小文件，比如图片等。 Data URL 由四部分组成：

- 前缀`data:`
- 指示数据类型的 MIME 类型。例如`image/jpeg`表示 JPEG 图像文件；如果此部分被省略，则默认值为`text/plain;charset=US-SACII`
- 如果为非文本数据，则可选 base64 做标记
- 数据

## JSON 中 stringify 输出注意

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
