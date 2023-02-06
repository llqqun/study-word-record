
## 常用配置  

```js
tinymce.init({
          selector: '#tinymceEdit',
          language: 'zh-Hans',
          auto_focus: 'tinymceEdit',
          plugins:
            'advlist autolink autoresize autosave charmap code directionality emoticons fullscreen image insertdatetime link lists media nonbreaking pagebreak preview save searchreplace table template visualblocks wordcount',
          toolbar: 'link code',
          setup: (editor) => {
            // 编辑器实例被渲染之前执行
            // editor 当前编辑器引用
          },
          init_instance_callback: (editor) => {
            //  编辑器实例被渲染之后执行
          }
        })
```

## 常用API

### DOM操作

editor.getBody()
> 返回可编辑区域的根元素。对于一个非内联的基于iframe的编辑器，返回iframe的主体元素  

editor.dom.create(name, attrs, html)  
> 创建一个html元素  
> name: 元素名称  
> attrs: 属性  
> html: 可选的HTML字符串，设置为元素的内部HTML。  
> return 返回创建的内容  

editor.dom.createRng()  
> 创建一个新的DOM范围对象。这将使用本地DOM范围API，如果它是可用的。如果没有，它将返回到自定义的TinyMCE实现。  

editor.addCommand()
> 在编辑器中添加一个自定义命令。这个函数也可以用来覆盖现有的命令。你添加的命令可以用execCommand执行。  
> addCommand(name: String, callback: Function, scope: Object)  

editor.execCommand()  
> 执行编辑器指令或者自定义指令  
> execCommand(cmd: String, ui: Boolean, value: Object | Array | String | Number | Boolean, args: Object): Boolean  
> 