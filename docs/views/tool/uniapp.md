# uniapp

## 微信小程序样式隔离

组件样式隔离设置
```js
options: {
    styleIsolation: 'isolated' // apply-shared shared
  }
```
- isolated 表示启用样式隔离，在自定义组件内外，使用 class 指定的样式将不会相互影响（一般情况下的默认值）；
- apply-shared 表示页面 wxss 样式将影响到自定义组件，但自定义组件 wxss 中指定的样式不会影响页面；
- shared 表示页面 wxss 样式将影响到自定义组件，自定义组件 wxss 中指定的样式也会影响页面和其他设置了 apply-shared 或 shared 的自定义组件。（这个选项在插件中不可用。）

注意: 当自定义组件设置为apply-shared时, 组件内调用其他组件,当前组件内样式不能影响其他自定义组件,此时需要到页面wxss内去定义样式

## 小程序间页面通信问题

微信小程序中通过 `getCurrentPages()` 获取页面栈,从而获取页面实例进行变量的修改

在uniapp 中不能这样做, 因为页面进行了编译,造成获取到的页面实例中变量名已经发生了改变, 此时若再进行修改则不会得到想要的结果

```js
// a页面
page({
  data: {
    key: 'www.baidu.com'
  }
})
// b 页面
const apage = getH5Page()
apage.key = 'www.asd.com'
// 此时的A页面中 key这个变量并不存在, 所以会重新创建这个变量

getH5Page () {
    const pages = getCurrentPages()
    return pages[pages.length - 2]
  }
```

uniapp 中的替代方案, 通过全局事件监听实现

```js
uni.$emit('change, '123')
uni.$on('change', (key) => {
  console.log(key)
})
```

## 微信小程序input组件type="nickname"获取微信昵称，v-model绑定值为空

解决办法:

> 注意  
> vue3 setup中没有this,通过getCurrentInstance()获取当前实例  
> 查询结果是异步的,放在同步代码中要进行同步处理

```js
uni.createSelectorQuery().in(this) // 注意这里要加上 in(this)  
    .select("#id")  
    .fields({  
        properties: ["value"],  
    })  
    .exec((res) => {  
        const nickName = res?.[0]?.value  
        console.log('昵称', nickName)  
    })
```

## scss添加全局变量样式文件

新建var.scss全局样式文件

```scss
$cyan: #4BBCA1;
$blue: #2373FF;
```

> 注意app.vue中引入的样式文件样式作用于全局,但是并不会在编译的时候替换开发中声明的变量
> 找到根目录下的uni.scss文件,在其中添加全局变量, 这样在编译的时候才会自动替换对应变量

```scss
@import './var.scss';
```

> 注意: 全局变量在app.vue中引入的样式文件中使用时,需要使用$符号,如:

```scss
.test {
  color: $cyan;
}
```
