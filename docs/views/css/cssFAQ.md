# CSS 笔记

## FAQ

工作中遇到的情况及处理

### 行内块元素问题

1. 元素间的间隙

元素设置为 `display: inline-block;`后兄弟元素间存在极小的间隙

解决方案, 给父元素添加样式` font-size: 0;`

2. 与样式`overflow: hidden;`同时存在则会产生元素错位效果

原因: 行内块的基线为其文档流内最后一个行盒的基线，除非该行内块没有文档流内行盒或者其 overflow 属性计算值不为 visible，这种情况下基线为下外边距边缘
所以,实际是元素的基线变成了底部边缘,和父元素对其

解决方案: 错位元素添加 `vertical-align: top;`

### 注意:

浮动元素不会压住文字

### 解决 iOS 滚动条被卡住的问题

```javascript
body,html{
  -webkit-overflow-scrolling: touch;
}
```

### 图片拖拽

默认浏览器图片是能拖拽的添加下面设置禁止拖拽

```javascript
-webkit-user-drag: none;
```

### `nth-child` 和 `nt-of-type` 的区别

E:nth-child(n) 和 E:nth-of-type(n) 区别

E:nth-child(n) => 先匹配父元素的第 n 个子元素,再去匹配 E 元素(从所有兄弟元素中找)

E:nth-of-type(n) => 先从兄弟元素中匹配 E 类型的元素,然后根据 n 去找到目标元素(从同类型兄弟元素中找)

### 清除浮动

```css
.clearfix:after {
  content: "";
  display: block;
  height: 0;
  clear: both;
  visibility: hidden;
}
.clearfix {
  /* IE6、7 专有 */
  *zoom: 1;
}
```

### 画三角形

```css
/* 等腰三角 */
.box {
  width: 0;
  height: 0;
  /* 1.只保留右边的边框有颜色 */
  border-color: transparent red transparent transparent;
  /* 2. 样式都是solid */
  border-style: solid;
  /* 3. 上边框宽度要大， 右边框 宽度稍小， 其余的边框该为 0 */
  border-width: 0 100px 0 0;
}
/* 斜三角 */
.box1 {
  width: 0;
  height: 0;
  /* 1.只保留右边的边框有颜色 */
  border-color: transparent red transparent transparent;
  /* 2. 样式都是solid */
  border-style: solid;
  /* 3. 上边框宽度要大， 右边框 宽度稍小， 其余的边框该为 0 */
  border-width: 100px 50px 0 0;
}
```

### 画小箭头

```javascript
.box {
  padding: 15px;
  background-color: #ffffff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow {
  display: inline-block;
  margin-right: 10px;
  width: 0;
  height: 0;
  /* Base Style */
  border: 16px solid;
  border-color: transparent #cddc39 transparent transparent;
  position: relative;
}

.arrow::after {
  content: "";
  position: absolute;
  right: -20px;
  top: -16px;
  border: 16px solid;
  border-color: transparent #fff transparent transparent;
}
/*下*/
.arrow.bottom {
  transform: rotate(270deg);
}
/*上*/
.arrow.top {
  transform: rotate(90deg);
}
/*左*/
.arrow.left {
  transform: rotate(180deg);
}
/*右*/
.arrow.right {
  transform: rotate(0deg);
}

```

示例 demo: https://codepen.io/lancelovejava/pen/popwgpG

## 动画**animation**

### 属性

| 名称                                                                                                      | 说明                |
| --------------------------------------------------------------------------------------------------------- | ------------------- |
| [`animation-name`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-name)                       | 动画名称            |
| [`animation-duration`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-duration)               | 动画时长            |
| [`animation-timing-function`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-timing-function) | 动画速度曲线        |
| [animation-timeline (en-US)](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)         | auto                |
| [`animation-delay`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-delay)                     | 动画开始时间,默认 0 |
| [`animation-iteration-count`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-iteration-count) | 动画播放次数        |
| [`animation-direction`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-direction)             | 是否逆向播放        |
| [`animation-fill-mode`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-fill-mode)             | 动画结束后元素状态  |
| [`animation-play-state`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-play-state)           | 动画运行或暂停      |

```css

```

# 技巧

### 块元素纵向布局

writing-mode 属性定义了文本水平或垂直排布以及在块级元素中文本的行进方向

此属性指定块流动方向，即块级容器堆叠的方向，以及行内内容在块级容器中的流动方向。因此，它也确定块级内容的顺序

```javascript
/* 关键值 */
writing-mode: horizontal-tb;
writing-mode: vertical-rl;
writing-mode: vertical-lr;

/* 全局值 */
writing-mode: inherit;
writing-mode: initial;
writing-mode: unset;
```

通过 flex 布局

```javascript
display: flex
flex-flow: column wrap;
```

### input 标签

删除 `type="number"` 末尾的箭头

```javascript
.no-arrow::-webkit-outer-spin-button,
.no-arrow::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
```

使用 `caret-color` 来修改光标的颜色

```javascript
caret-color: #ffd476;
```

修改 input placeholder 样式

```javascript
input::-webkit-input-placeholder {
  color: #babbc1;
  font-size: 12px;
}
```

`outline:none` 删除输入状态线

```javascript
outline: none;
```

input 自动填充颜色设置

```javascript
// 设置透明度
  input:-internal-autofill-previewed,
    input:-internal-autofill-selected {
        -webkit-text-fill-color: #807c7c;
        transition: background-color 5000s ease-out 0.5s;
    }

// 通过动画延迟
input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      transition-delay: 99999s;
      transition: color 99999s ease-out, background-color 99999s ease-out;
      -webkit-transition-delay: 99999s;
      -webkit-transition: color 99999s ease-out, background-color 99999s ease-out;
      -webkit-text-fill-color: #807c7c;
    }
```

### 固定元素宽高比

aspect-ratio

### 滚动条设置::-webkit-scrollbar( webkit 的浏览器)

```javascript
::-webkit-scrollbar    //滚动条整体部分
::-webkit-scrollbar-button   //滚动条两端的按钮
::-webkit-scrollbar-track   // 外层轨道
::-webkit-scrollbar-track-piece    //内层轨道，滚动条中间部分（除去）
::-webkit-scrollbar-thumb //滚动条里面可以拖动的那个
::-webkit-scrollbar-corner   //边角
::-webkit-resizer   ///定义右下角拖动块的样式

.box-hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}
```

## 文本操作

### 优先使用系统字体

```css
font-family: system-ui;
```

### 不允许选择文本

```javascript
user-select: none;
```

### 自定义选定的文本样式

```javascript
::selection {
  color: #ffffff;
  background-color: #ff4c9f;
}
```

### 单行文本溢出显示省略号

```
/*1. 先强制一行内显示文本*/
white-space: nowrap;  （ 默认 normal 自动换行）
/*2. 超出的部分隐藏*/
overflow: hidden;
/*3. 文字用省略号替代超出的部分*/
text-overflow: ellipsis;
```

### 多行文本溢出显示省略号

**有较大兼容性问题**，适合于 webKit 浏览器或移动端（移动端大部分是 webkit 内核）

```javascript
/*1.超出的部分隐藏 */
overflow: hidden;
/*2. 文字用省略号替代超出的部分 */
text-overflow: ellipsis;
/* 3. 弹性伸缩盒子模型显示 */
display: -webkit-box;
/* 4. 限制在一个块元素显示的文本的行数 */
-webkit-line-clamp: 2;
/* 5. 设置或检索伸缩盒对象的子元素的排列方式 */
-webkit-box-orient: vertical;
```

### 文本竖向排列

**writing-mode** 属性定义了文本水平或垂直排布以及在块级元素中文本的行进方向

此属性指定块流动方向，即块级容器堆叠的方向，以及行内内容在块级容器中的流动方向。

```javascript
div {
    writing-mode: vertical-lr;
}

```
