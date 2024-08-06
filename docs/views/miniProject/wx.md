---
title: 微信小程序
---

## 封装Vue2写法工具函数

```js
const basic = Behavior({
  methods: {
      $emit(name, detail, options) {
          this.triggerEvent(name, detail, options);
      },
      set(data) {
          this.setData(data);
          return new Promise((resolve) => wx.nextTick(resolve));
      },
  },
})
function mapKeys(source, target, map) {
    Object.keys(map).forEach((key) => {
        if (source[key]) {
            target[map[key]] = source[key];
        }
    });
}
export default function VantComponent(vantOptions) {
    const options = {};
    mapKeys(vantOptions, options, {
        data: 'data',
        props: 'properties',
        watch: 'observers',
        mixins: 'behaviors',
        methods: 'methods',
        beforeCreate: 'created',
        created: 'attached',
        mounted: 'ready',
        destroyed: 'detached',
        classes: 'externalClasses',
    });
    // add default externalClasses
    options.externalClasses = options.externalClasses || [];
    options.externalClasses.push('custom-class');
    // add default behaviors
    options.behaviors = options.behaviors || [];
    options.behaviors.push(basic);
    // add relations
    const { relation } = vantOptions;
    if (relation) {
        options.relations = relation.relations;
        options.behaviors.push(relation.mixin);
    }
    // map field to form-field behavior
    if (vantOptions.field) {
        options.behaviors.push('wx://form-field');
    }
    // add default options
    options.options = {
        multipleSlots: true,
        addGlobalClass: true,
    };
    Component(options);
}

```

## 模板中使用函数

通过wxs模块，可以在wxml中直接使用js函数

[官方方案](https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/01wxs-module.html)

## 自定义组件渲染后没有组件标签和有组件标签的情况

[参考](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html#%E8%99%9A%E6%8B%9F%E5%8C%96%E7%BB%84%E4%BB%B6%E8%8A%82%E7%82%B9)

默认情况下，自定义组件本身的那个节点是一个“普通”的节点，使用时可以在这个节点上设置 class style 、动画、 flex 布局等，就如同普通的 view 组件节点一样。

但有些时候，自定义组件并不希望这个节点本身可以设置样式、响应 flex 布局等，而是希望自定义组件内部的第一层节点能够响应 flex 布局或者样式由自定义组件本身完全决定。
这种情况下，可以将这个自定义组件设置为“虚拟的”
```js
export default {
    options: {
        virtualHost: true
    }
}
```

需要注意的是，自定义组件节点上的 class style 和动画将不再生效，但仍可以：

将 style 定义成 properties 属性来获取 style 上设置的值；  
将 class 定义成 externalClasses 外部样式类使得自定义组件 wxml 可以使用 class 值。


