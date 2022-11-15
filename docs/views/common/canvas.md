# Canvas 学习笔记

1.canvas 画布只能固定尺寸,可以动态改变元素尺寸,但是内容画像会拉伸变形

2.[`CanvasRenderingContext2D`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D#%E7%BB%98%E5%88%B6%E6%96%87%E6%9C%AC)是2D渲染上下文的主要对象

处理跨域图片

img.setAttribute("crossOrigin", "anonymous");

## 属性

| 属性名                                                       | 解释                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| lineJoin                                                     | 决定了图形中两线段连接处所显示的样子 miter round bevel       |
| miterLimit                                                   | 设定外延交点与连接点的最大距离,如果交点距离大于此值，连接效果会变成了 bevel |
| strokeStyle                                                  | 画笔（绘制图形）颜色或者样式的属性                           |
| lineWidth                                                    | 线段厚度的属性                                               |
| lineDashOffset                                               | 设置线段起始偏移量                                           |
| [`globalCompositeOperation`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) | 设定了在画新图形时采用的遮盖策略                             |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |
|                                                              |                                                              |

## 函数

基本操作

```javascript
// 获取元素
var canvas = document.getElementById('tutorial');
// 获取元素渲染上下文
var ctx = canvas.getContext('2d');

```

| 函数名称                                                     | 解释                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [`fillRect(x, y, width, height)`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/fillRect) | 绘制一个填充的矩形                                           |
| [`strokeRect(x, y, width, height)`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/strokeRect) | 绘制一个矩形的边框                                           |
| [`clearRect(x, y, width, height)`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/clearRect) | 清除指定矩形区域，让清除部分完全透明。                       |
| beginPath()                                                  |                                                              |
| closePath()                                                  |                                                              |
| stroke()                                                     | 根据当前的画线样式，绘制当前或已经存在的路径的方法。         |
| fill()                                                       | 根据当前的填充样式，填充当前或已存在的路径的方法。采取非零环绕或者奇偶环绕规则,nonzero([非零环绕规则](http://en.wikipedia.org/wiki/Nonzero-rule))默认值, evenodd([奇偶环绕规则](http://en.wikipedia.org/wiki/Even–odd_rule)) |
| [`lineTo(x, y)`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/lineTo) | 绘制一条从当前位置到指定 x 以及 y 位置的直线                 |
| [`arc(x, y, radius, startAngle, endAngle, anticlockwise)`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/arc) | 画一个以（x,y）为圆心的以 radius 为半径的圆弧（圆），从 startAngle 开始到 endAngle 结束，按照 anticlockwise 给定的方向（默认为顺时针）来生成 |
| [`arcTo(x1, y1, x2, y2, radius)`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/arcTo) | 根据给定的控制点和半径画一段圆弧，再以直线连接两个控制点     |
| quadraticCurveTo(cp1x, cp1y, x, y)                           | 绘制二次贝塞尔曲线，`cp1x,cp1y`为一个控制点，`x,y为`结束点。 |
| bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)                  | 绘制三次贝塞尔曲线，`cp1x,cp1y`为控制点一，`cp2x,cp2y`为控制点二，`x,y`为结束点。 |
| setLineDash                                                  | 接受一个数组，来指定线段与间隙的交替                         |
| createLinearGradient(x0, y0, x1, y1)                         | 创建一个沿参数坐标指定的直线的渐变                           |
| [`createRadialGradient(x1, y1, r1, x2, y2, r2)`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/createRadialGradient) | 绘制放射性渐变的方法                                         |
| addColorStop                                                 | 添加一个由**偏移值**和**颜色值**指定的断点到渐变             |
| createPattern(img, repeat)                                   | 使用图片填充画布                                             |
| [`drawImage(image, x, y, width, height)`](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/drawImage) | 绘制指定的图片(主要画图方法)                                 |
| toDataURL()                                                  | 将canvas保存为图片                                           |
| toBlob()                                                     | 将Canvas转换 Blob对象                                        |
| save()                                                       | 将当前状态放入栈中，保存 canvas 全部状态的方法               |
| restore()                                                    | 在绘图状态栈中弹出顶端的状态，将 canvas 恢复到最近的保存状态的方法。如果没有保存状态，此方法不做任何改变。 |

## 阴影效果

实现原理即在下次渲染时首先填充一个含有透明度的蒙层,再画内容

```javascript
function clear() {
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
}
```

