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
