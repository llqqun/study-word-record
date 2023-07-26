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
