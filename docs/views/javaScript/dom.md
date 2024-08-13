# DOM 操作  

## Node API

### Node.insertBefore()  

> 在指定父节点内的参考节点前插入子节点(意思就是在指定节点前插入一个节点)  
> 如果给定的子节点是对文档中现有节点的引用，insertBefore() 会将其从当前位置移动到新位置(意思就是给节点移动位置)  

var insertedNode = parentNode.insertBefore(newNode, referenceNode);

* insertedNode 被插入节点 (newNode)
* parentNode 新插入节点的父节点
* newNode 用于插入的节点
* referenceNode newNode 将要插在这个节点之前  

### Text.splitText(offset)  

> 根据偏移位置对Text节点进行切割  
> 分割后的文本节点还可以使用Node.normalize方法来合并  
> offset文本节点的索引,从1开始计数  

### getBoundingClientRect()  获取元素相对窗口的位置信息及元素本身宽高

Element.getBoundingClientRect() 方法返回一个 DOMRect 对象，其提供了元素的大小及其相对于视口的位置。

### 控制用户选择行为--selectstart 事件

控制用户选择文本的行为

```js
// 禁止用户选择页面内的任一内容
document.onselectstart = function() {
    console.log(event)
	if (event.srcElement.type != "text" && event.srcElement.type != "textarea" && event.srcElement.type != "password") return false;
	else return true;
};
```

## 元素滚动操作

### API: ele.scrollIntoView()

滚动元素的父容器，使被调用 scrollIntoView() 的元素对用户可见。

### 监听指定元素的高度变化,触发滚动

```javascript
function elementHeightChangeScrollEnd (ele, callback) {
  if (typeof ele === 'string') {
    ele = document.querySelector(ele)
  } else if (typeof ele === 'object') {
    const domProp = ele.constructor.name
    if (!domProp.includes('Element')) {
      throw new Error('参数错误:请传入一个Element对象')
    }
  }
  const config = { attributes: true, childList: true, subtree: true }
  const fun = (typeof callback === 'function')
    ? callback
    : function () {
      document.body.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
    }
  const observer = new MutationObserver(fun)
  observer.observe(ele, config)
  return observer
}
```
