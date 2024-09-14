# JS工具函数

## 强制休眠,同步等待

```js
const sleep = async (t) => new Promise((resolve) => setTimeout(resolve, t));

async function demo () {
  console.log('开始')
  await sleep(2000).then(() => console.log('等待了2秒'))
  console.log('等待结束')
}
demo()
```

## cookie获取转换为对象

```js
const getCookie = () => document.cookie
    .split(';')
    .map((item) => item.split('='))
    .reduce((acc, [k, v]) => (acc[k.trim().replace('"', '')] = v) && acc, {})
```

## 去除文本中的html标签

DOMParser 可以将存储在字符串中的 XML 或 HTML 源代码解析为一个 DOM Document。

```js
const stripHtml = (html) => new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
stripHtml('<div>test</div>') // 'test'
```

## File, Blob, ArrayBuffer 格式转换

> file 转 ArrayBuffer

```js
const fr = new FileReader()
fr.onload = function(loadEvent) {
  var arrayBuffer = loadEvent.target.result;
};
fr.readAsArrayBuffer(file);
```

> blob 转 file

```js
const blobData = axios.get('url', { responseType: 'blob'})
const fileCach = new File([blobData], '测试文件.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
```

## 文件下载

> a标签下载

```js
let ele = document.getElementById('postmessage_2079592')
let imgarr = Array.from(ele.querySelectorAll('img'))
imgarr.forEach(async (item,index) => {
    if(index !== 0) {
  let response = await fetch(item.src) // 内容转变成blob地址
  let blob = await response.blob() // 创建隐藏的可下载链接
  let objectUrl = window.URL.createObjectURL(blob)
  let type = item.src.substring(item.src.lastIndexOf('.'))
 // 延时下载 浏览器下载并发时通过延时解决
        setTimeout(() => {
            let a = document.createElement('a');
            a.href = objectUrl;
            a.innerText=index
            a.download= item.id+type;
            a.target = '_blank';
            a.click();
            a.remove()
        }, 1000 * index)
    }
})
```

> blob下载(使用axios工具)

```js
const blobData = await axios.get(item.content, { responseType: 'blob'})
const filePath = URL.createObjectURL(blobData)
// 将filePath丢到a标签中即可
```

> 数据流下载

```js

```

## 金额格式化

```js
/**
 * 
 * number 格式化金额
 * decimals 保留小数位数
 * dec_point  小数点符合
 * thousands_sep  千分位符合
 * */
export const moneyFormat = (number, decimals, dec_point, thousands_sep) => {
  number = (number + '').replace(/[^0-9+-Ee.]/g, '')
  const n = !isFinite(+number) ? 0 : +number
  const prec = !isFinite(+decimals) ? 2 : Math.abs(decimals)
  const sep = typeof thousands_sep === 'undefined' ? ',' : thousands_sep
  const dec = typeof dec_point === 'undefined' ? '.' : dec_point
  let s = ''
  const toFixedFix = function(n, prec) {
    const k = Math.pow(10, prec)
    return '' + Math.ceil(n * k) / k
  }
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
  const re = /(-?\d+)(\d{3})/
  while (re.test(s[0])) {
    s[0] = s[0].replace(re, '$1' + sep + '$2')
  }

  if ((s[1] || '').length < prec) {
    s[1] = s[1] || ''
    s[1] += new Array(prec - s[1].length + 1).join('0')
  }
  return s.join(dec)
}
```

## 滚动至页面顶部

```js
const scrollToTop = () => {
  const height = document.documentElement.scrollTop || document.body.scrollTop;
  if (height > 0) {
    window.requestAnimationFrame(scrollToTop);
    window.scrollTo(0, height - height / 8);
  }
}
```

## 获取URL参数

```js
const getSearchParams = () => {
  const searchPar = new URLSearchParams(window.location.search)
  const paramsObj = {}
  for (const [key, value] of searchPar.entries()) {
    paramsObj[key] = value
  }
  return paramsObj
}
```

## 内容全屏

```js
// 进入
export const launchFullscreen = (element) => {
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullScreen()
  }
}
// 退出
export const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  }
}
```

## 手机号脱敏

```js
export const hideMobile = (mobile) => {
  return mobile.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2")
}
```

## 数据类型判断

```js
export const typeOf = function(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
}
typeOf(123) // 'number'
typeOf('123') // 'string'
typeOf({}) // 'object'
```

## 万亿以下数字转中文

```js
function numToChines(num) {
            let resultNum = ''
            const strArray = num.toString().replace(/(?=(\d{4})+$)/g, ',').split(',').filter(Boolean)
            const chart = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
            const units = ['', '十', '百', '千']
            const maxUnits = ['', '万', '亿']
            function _transform(numStr) {
                let result = ''
                for (let index = 0; index < numStr.length; index++) {
                    const digit = +numStr[index];
                    const n = chart[digit]
                    const u = units[numStr.length - 1 - index]
                    // 如果等于零就不添加单位
                    if (digit === 0) {
                        // 排除连续为零的情况
                        if (result[result.length - 1] !== chart[0]) {
                            result += n
                        }
                    } else {
                        result += n + u
                    }
                }
                // 排除末尾是零的情况
                if (result[result.length - 1] === chart[0]) {
                    result = result.slice(0, -1)
                }
                return result
            }

            for (let i = 0; i < strArray.length; i++) {
                const r = _transform(strArray[i]);
                resultNum += r ? r + maxUnits[strArray.length - 1 - i] : ''
            }
            return resultNum
        }
        console.log(numToChines(120000))
```

## 判断当前环境是否移动端

```javascript
isPc() {
    let userAgentInfo = navigator.userAgent
    let Agents = new Array(
      'Android',
      'iPhone',
      'SymbianOS',
      'Windows Phone',
      'iPad',
      'iPod'
    )
    var flag = true
    flag = !Agents.some((ele) => {
        return userAgentInfo.indexOf(ele) > 0
    })
    return flag
  }
```

函数柯里化

```javascript
function add(params) {
        let args = Array.prototype.slice.call(arguments)
        function _add(params) {
          args.push(...arguments)
          return _add
        }
        _add['getValue'] = () => {
            return args.reduce((a,b) => a + b)
          }
        return _add
      }
add(1)(2)(3)(4).getValue()
```

## 冻结对象

```javascript
var constantize = (obj) => {
  Object.freeze(obj);
  Object.keys(obj).forEach( (key, i) => {
    if ( typeof obj[key] === 'object' ) {
      constantize( obj[key] );
    }
  });
};
```

## 生成随机key

```javascript
function generateKey(keyLength = 18) {
  let rlt = ''
  for (let i = 0; i < keyLength; i++) {
    if (Math.round(Math.random())) {
      rlt += Math.ceil(Math.random() * 9)
    } else {
      const ranNum = Math.ceil(Math.random() * 23)
      if (Math.round(Math.random())) {
        rlt += String.fromCharCode(65 + ranNum)
      } else {
        rlt += String.fromCharCode(97 + ranNum)
      }
    }
    //加上-，不要的可以去掉
    if ((i + 1) % 6 === 0 && i > 2 && i < 17) {
      rlt += '-'
    }
  }
  return rlt
}
```

## 节流防抖

```javascript
// 节流
function throttle(fn = Function, time = 600) {
  let o_time = null
  return (params) => {
    if (o_time) return
    o_time = setTimeout(() => {
      fn(params)
      o_time = null
    }, time)
  }
}
// 防抖
function antishake(fn = Function, delay = 600) {
  let time = null
  return (params) => {
    if (time) {
      clearTimeout(time)
    }
    time = setTimeout(() => {
      fn(params)
      time = null
    }, delay)
  }
}
```

## rem 布局函数

```javascript
function setRem() {
  const baseSize = 100
  const _w = document.documentElement.clientWidth
  let view = document.documentElement.clientWidth
  if (_w > 750) {
    view = 750
  } else if (_w < 320) {
    view = 320
  }
  const scale = view / 750
  //得到html的Dom元素
  let htmlDom = document.getElementsByTagName('html')[0]
  //设置根元素字体大小
  htmlDom.style.fontSize = baseSize * Math.min(scale, 2) + 'px'
}
// 初始化
setRem()
// 改变窗口大小时重新设置 rem
window.onresize = function () {
  setRem()
}
```

## 日期处理

```javascript
function parseTime(time, cFormat) {
  if (arguments.length === 0) {
    return null
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
      time = parseInt(time)
    }
    if (typeof time === 'number' && time.toString().length === 10) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay(),
  }
  return format.replace(/{([ymdhisa])+}/g, (result, key) => {
    const value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') {
      return '星期' + ['日', '一', '二', '三', '四', '五', '六'][value]
    }
    return value.toString().padStart(2, '0')
  })
}
```

## 资源路径转换

```javascript
export function prefix(url,baseUrl = process.env.VUE_APP_PATH) {
  if (url && (url.startsWith('http') || url.startsWith('//') || url.startsWith('https'))) {
    return url
  } else if (url) {
    url = `${baseUrl}${url}`
    return url
  } else {
    return ''
  }
}
```

## 格式化money

```javascript
const ThousandNum = num => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const money = ThousandNum(1000000);
// money => '1,000,000'
```

## 生成随机 HEX 颜色值

```javascript
const RandomColor = () => "#" + Math.floor(Math.random() * 0xffffff).toString(16).padEnd(6, "0");
```

## 网址查询参数(URLSearchParams)

```javascript
const params = new URLSearchParams(location.search.replace(/\?/ig, ""));
// location.search = "?name=test&sex=man"
params.has("test"); // true
params.get("sex"); // "man"
```

## 数字处理

```javascript
const num1 = ~~ 1.19;
const num2 = 2.29 | 0;
const num3 = 3.09 >> 0;
//类似使用
// Math.floor() 或 Math.ceil()
// num1 num2 num3 => 1 2 3
```

## 精确小数

```javascript
// 可以根据需要替换round为floor 或ceil
const RoundNum = (num, decimal) => Math.round(num * 10 ** decimal) / 10 ** decimal;
const num = RoundNum(1.2345, 2);
```

## 位运算进行奇偶判断

按位与运算符 (`&`) 在两个操作数对应的二进位都为 `1` 时，该位的结果值才为 `1`，否则为 `0`

```javascript
const OddEven = num => !!(num & 1) ? "odd" : "even";
const num = OddEven(2);
// num => "even"
```

## 生成范围随机数

```js
const RandomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const num = RandomNum(1, 10); // 5
```

## 数据类型判断

```javascript
function DataType(tgt, type) {
    const dataType = Object.prototype.toString.call(tgt).replace(/\[object (\w+)\]/, "$1").toLowerCase();
    return type ? dataType === type : dataType;
}
```

## 数组去重

```javascript
// 最简单版只能处理数值
const arr = [...new Set([0, 1, 1, null, null])];
// filter + indexOf去重
function unique(arr) {
  return arr.filter(function(item, index, arr) {
    return arr.indexOf(item) === index;
  });
}
// 完美去重(对象不行)
function uniqueArray(array) {
  let map = {};
  let res = [];
  for(var i = 0; i < array.length; i++) {
    if(!map.hasOwnProperty(array[i])) {
      console.log(map)
      map[array[i]] = 1;
      res.push(array[i]);
    }
  }
  return res;
}
```

## 混淆数组

```js
const arr = [0, 1, 2, 3, 4, 5].slice().sort(() => Math.random() - .5);
```

## 首屏加载时间计算和白屏事件计算

```javascript
console.log('首屏时间:' + (window.performance.timing.domInteractive - window.performance.timing.navigationStart))
    console.log('白屏时间:' + (window.performance.timing.domLoading - window.performance.timing.navigationStart))
```

## 图片懒加载

3种方法

通过设置DataSet API设置临时存放sr路径的data-src属性

当图片出现在视窗位置,则修改src为data-src

```javascript
//根据滚动的高度计算要显示的图片元素
//contentH 视窗高度 + 滚动高度, nodeH 元素高度(固定值), imgNum 一行显示的图片数量
demo1(contentH,nodeH,imgNum = 1) {
      let num = Math.ceil(contentH / nodeH) * imgNum
      this.imglist.find((node,index) => {
        if (index === num) {
          return true
        }
        node.src = node.dataset.src
      })
    },
        // 通过getBoundingClientRect API获取元素相对于视窗位置信息,从而判断图片位置,决定是否加载图片
        demo2() {
      let aa = this.imglist.find((node,index) => {
        if (node.getBoundingClientRect().top >= this.$refs.app.clientHeight ) {
          return true
        }
        node.src = node.dataset.src
      })
    },
// 通过 IntersectionObserver API 监听目标元素实现
demo3() {
      const observer = new IntersectionObserver((changes, obs) => {
      // changes: 目标元素集合
      changes.forEach((change) => {
        // intersectionRatio
        if (change.isIntersecting) {
          const img = change.target;
          img.src = img.dataset.src;
          obs.unobserve(img);
        }
      });
    }, {
        root: this.$refs.app,
      });
       this.imglist.forEach(node => {
      observer.observe(node);
       })
    },
```

## [浏览器复制粘贴功能](https://codepen.io/lancelovejava/pen/jOZoGvx?editors=1010)

```javascript
const selection = window.getSelection();
  // RangeAPI: 制造区域
  const range = new Range();
  let ele = document.querySelector(".language-js");
  range.selectNodeContents(ele);
  // Selection: 选中区域
  selection.removeAllRanges();
  selection.addRange(range);
  let selectedText = selection.toString();

// 获取剪贴板内容
const text = await navigator.clipboard.readText();
// 往剪切板填入内容
navigator.clipboard.writeText(selectedText)
```

## 实现页面不可复制

css

```css
{
 user-select: none;
}
```

js

```javascript
document.body.onselectstart = (e) => {
  e.preventDefault();
};

document.body.oncopy = (e) => {
  e.preventDefault();
};
```

## 自定义HTML模板

```javascript
 // 例子
<script type="text/html" id="tpl-user">
    <div>姓名：{{name}}</div>
    <div>年龄：{{ age }}</div>
    <div>性别：{{  gender}}</div>
    <div>住址：{{address  }}</div>
  </script>

function template(id = 'tpl-user', data) {
  var str = document.getElementById(id).innerHTML
  var pattern = /{{\s*([a-zA-Z]+)\s*}}/

  var pattResult = null
  while (pattResult = pattern.exec(str)) {
    str = str.replace(pattResult[0], data[pattResult[1]])
  }

  return str
}
var data = { name: 'zs', age: 28, gender: '男', address: '北京顺义马坡' }

    // 调用模板引擎
    var htmlStr = template('tpl-user', data)

    // 渲染HTML结构
    document.getElementById('user-box').innerHTML = htmlStr
```

## 过滤数组

```js
const arr = [undefined, null, "", 0, false, NaN, 1, 2].filter(Boolean);
```

## 深度克隆对象

```javascript
const _obj = { a: 0, b: 1, c: 2 };
const obj = { ..._obj };
const obj = JSON.parse(JSON.stringify(_obj));
// 深度克隆
function deepClone(source) {
  if (!source && typeof source !== 'object') {
    throw new Error('复制错误', 'deepClone');
  }
  const targetObj = source.constructor === Array ? [] : {};
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys]);
    } else {
      targetObj[keys] = source[keys];
    }
  });
  return targetObj;
}
// 
const clone = parent => {
  // 判断类型
  const isType = (obj, type) => {
    if (typeof obj !== "object") return false;
    const typeString = Object.prototype.toString.call(obj);
    let flag;
    switch (type) {
      case "Array":
        flag = typeString === "[object Array]";
        break;
      case "Date":
        flag = typeString === "[object Date]";
        break;
      case "RegExp":
        flag = typeString === "[object RegExp]";
        break;
      default:
        flag = false;
    }
    return flag;
  };

  // 处理正则
  const getRegExp = re => {
    var flags = "";
    if (re.global) flags += "g";
    if (re.ignoreCase) flags += "i";
    if (re.multiline) flags += "m";
    return flags;
  };
  // 维护两个储存循环引用的数组
  const parents = [];
  const children = [];

  const _clone = parent => {
    if (parent === null) return null;
    if (typeof parent !== "object") return parent;

    let child, proto;

    if (isType(parent, "Array")) {
      // 对数组做特殊处理
      child = [];
    } else if (isType(parent, "RegExp")) {
      // 对正则对象做特殊处理
      child = new RegExp(parent.source, getRegExp(parent));
      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
    } else if (isType(parent, "Date")) {
      // 对Date对象做特殊处理
      child = new Date(parent.getTime());
    } else {
      // 处理对象原型
      proto = Object.getPrototypeOf(parent);
      // 利用Object.create切断原型链
      child = Object.create(proto);
    }

    // 处理循环引用
    const index = parents.indexOf(parent);

    if (index != -1) {
      // 如果父数组存在本对象,说明之前已经被引用过,直接返回此对象
      return children[index];
    }
    parents.push(parent);
    children.push(child);

    for (let i in parent) {
      // 递归
      child[i] = _clone(parent[i]);
    }

    return child;
  };
  return _clone(parent);
};
```

## 显示所有DOM边框

```javascript
[].forEach.call($$("*"), dom => {
    dom.style.outline = "1px solid #" + (~~(Math.random() * (1 << 24))).toString(16);
});
```

## 响应式页面REM计算

```javascript
function AutoResponse(width = 750) {
   const target = document.documentElement;
   let view = document.documentElement.clientWidth
   document.documentElement.style.fontSize = (view / width) * 100 + 'px'
}
```

## 过滤XSS攻击

```js
function FilterXss(content) {
    let elem = document.createElement("div");
    elem.innerText = content;
    const result = elem.innerHTML;
    elem = null;
    return result;
}
```

## 创建JSON数据下载

```javascript
function download(url, name) {
  const a = document.createElement("a");
  a.download = name;
  a.rel = "noopener";
  a.href = url;
  // 触发模拟点击
  a.dispatchEvent(new MouseEvent("click"));
  // 或者 a.click()
}

const json = {
  a: 3,
  b: 4,
  c: 5,
};
const str = JSON.stringify(json, null, 2);

// 方案一：Text -> DataURL
const dataUrl = `data:,${str}`;
download(dataUrl, "demo.json");

// 方案二：Text -> Blob -> ObjectURL
const url = URL.createObjectURL(new Blob(str.split("")));
download(url, "demo1.json");
```

## 文件上传

input标签声明type为file即可进行文件上传操作

```html
<input type="file" change="onUpload"></input>
```

```javascript
function onUpload (e) {
    let file = $event.target.files[0]
    var form = new FormData();
    form.append("file", file); 
    const xhr = new XMLHttpRequest(); 
    xhr.open("post", url, true)
    xhr.send(form);
}
```

## dom转图片

DOM -> SVG -> Canvas -> JPEG/PNG

```javascript
var htmlSvg =
  'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="' +
  dom.offsetWidth +
  '" height="' +
  dom.offsetHeight +
  '"><foreignObject x="0" y="0" width="100%" height="100%">' +
  new XMLSerializer().serializeToString(cloneDom) +
  document.querySelector("style").outerHTML +
  "</foreignObject></svg>";
```

<https://codepen.io/lancelovejava/pen/xxWMKgj>

## 首屏加载动画实现

1.在Vue中实现首屏动画,直接修改index.html
 可以先在index页面固定一个动画效果,当页面加载完成后再取消这个动画

```css
#apploading {
        position: fixed;
        width: 100vw;
        height: 100vh;
        z-index: 9999999999;
        background-color: #fff;
      }
      #loading {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100px;
        height: 100px;
        transform: translate(-50%, -50%) rotate(30deg);
      }
      #loading::before,
      #loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        display: block;
        width: 20px;
        height: 20px;
        border-radius: 10px;
        transform: translate(-50%, -50%);
        background-color: transparent;
      }
      #loading::before {
        animation: before 1.6s infinite;
      }
      #loading::after {
        animation: after 1.6s infinite;
      }
      @keyframes before {
        0% {
          width: 20px;
          box-shadow: 20px -20px rgba(225, 20, 98, 0.75),
            -20px 20px rgba(111, 202, 220, 0.75);
        }
        35% {
          width: 100px;
          box-shadow: 0 -20px rgba(225, 20, 98, 0.75),
            0 20px rgba(111, 202, 220, 0.75);
        }
        70% {
          width: 20px;
          box-shadow: -20px -20px rgba(225, 20, 98, 0.75),
            20px 20px rgba(111, 202, 220, 0.75);
        }
        100% {
          box-shadow: 20px -20px rgba(225, 20, 98, 0.75),
            -20px 20px rgba(111, 202, 220, 0.75);
        }
      }
      @keyframes after {
        0% {
          height: 20px;
          box-shadow: 20px 20px rgba(61, 184, 143, 0.75),
            -20px -20px rgba(233, 169, 32, 0.75);
        }
        35% {
          height: 100px;
          box-shadow: 20px 0 rgba(61, 184, 143, 0.75),
            -20px 0 rgba(233, 169, 32, 0.75);
        }
        70% {
          height: 20px;
          box-shadow: 20px -20px rgba(61, 184, 143, 0.75),
            -20px 20px rgba(233, 169, 32, 0.75);
        }
        100% {
          box-shadow: 20px 20px rgba(61, 184, 143, 0.75),
            -20px -20px rgba(233, 169, 32, 0.75);
        }
      }
```

```html
<body>
    <div id="apploading">
      <div id="loading"></div>
    </div>
    <div id="app"></div>
  </body>
```

```javascript
onMounted(() => {
  let loadDOM: HTMLDivElement | null = document.querySelector("#apploading");
  if (loadDOM) {
    setTimeout(() => {
      document.body.removeChild(loadDOM!);
      loadDOM = null;
    }, 1000);
  }
});

```

## 判断一个对象的类型

```js
function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

var is = {
  arr: function (a) { return Array.isArray(a); },
  obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
  pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
  svg: function (a) { return a instanceof SVGElement; },
  inp: function (a) { return a instanceof HTMLInputElement; },
  dom: function (a) { return a.nodeType || is.svg(a); },
  str: function (a) { return typeof a === 'string'; },
  fnc: function (a) { return typeof a === 'function'; },
  und: function (a) { return typeof a === 'undefined'; },
  nil: function (a) { return is.und(a) || a === null; },
  hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
  rgb: function (a) { return /^rgb/.test(a); },
  hsl: function (a) { return /^hsl/.test(a); },
  col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
};

```
