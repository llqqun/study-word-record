# Tinymce

[Tinymce](https://www.tiny.cloud/)

[vite-vue3-tinymce](https://github.com/llqqun/vite-study-build)

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

## 注意事项

语言包去官网下载

npm方式下载的tinymce配置如下

将tinymce包复制一份，放到静态资源目录，配置静态资源路径

目录结构如下

```
|- tinymce
  |- icons
    |- default
      |- icons.js
  |- langs
    |- zh_CN.js
  |- models
    |- dom
      |- model.js
  |- plugins
  |- skins
  |- themes
```

修改配置
```js
tinymce.init({
    selector: '#word-editor',
    // 注意：正常使用必须设置这个！！！基础路径设置，配置编辑器需要使用的静态资源路径
    base_url: '/tinymce',
    // 语言包设置
    language: 'zh_CN',
    language_url: '/tinymce/langs/zh_CN.js',
    // 自定义编辑器内容区样式
    content_css: '/tinymce/custom.css',
    // 添加扩展图标
    icons: 'ft_icon',
  }).then((editor) => {
    console.log(editor[0]);
    editor[0].setContent('<p>这是一段测试内容</p>');
  }).catch((err) => {
    console.error(err);
  });
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