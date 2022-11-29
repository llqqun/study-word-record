# tinymce 6 API

## 核心属性

| API名称         | 类型                                                         | 介绍                                          | 所属对象 |
| --------------- | ------------------------------------------------------------ | --------------------------------------------- | -------- |
| DOM             | [DOMUtils](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.dom.domutils/) | 全局的DOM实例                                 | tinymce  |
| PluginManager   | [AddOnManager](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.addonmanager/) | 全局插件管理器实例                            |          |
| ScriptLoader    | [ScriptLoader](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.dom.scriptloader/) | 全局脚本加载器实例                            |          |
| ThemeManager    | [AddOnManager](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.addonmanager/) | 主题管理对象                                  |          |
| activeEditor    | [Editor](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.editor/) | 获取当前活动的编辑器实例                      |          |
| baseURI         | [URI](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.util.uri/) | TinyMCE 安装路径的绝对基本 URI                |          |
| baseURL         | String                                                       | 如果 TinyMCE 所在的根目录，则为基本 URL       |          |
| documentBaseURL | String                                                       | 当前文档所在的文档基 URL                      |          |
| i18n            | Object                                                       | 语言包数据的集合                              |          |
| majorVersion    | String                                                       |                                               |          |
| minorVersion    | String                                                       |                                               |          |
| releaseDate     | String                                                       |                                               |          |
| suffix          | String                                                       | 当前要添加到每个插件/主题的后缀，例如".min"。 |          |



## 函数

| Name                                                         | Summary                                                      | Defined by |
| :----------------------------------------------------------- | :----------------------------------------------------------- | :--------- |
| [add()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#add) | 将编辑器实例添加到编辑器集合。这也将把它设置为激活编辑器     | `tinymce`  |
| [addI18n()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#addI18n) | 添加一个语言包，它由加载的语言文件（如 en.js）调用。         | `tinymce`  |
| [createEditor()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#createEditor) | 创建一个编辑器实例并将其添加到编辑器管理器集合中.            | `tinymce`  |
| [each()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#each) | 工具函数: 通过回调函数迭代数组或者对象,回调返回false,则迭代终止 | `tinymce`  |
| [execCommand(n,u,v)](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#execCommand) | 在当前活动的编辑器上执行特定命令(注册过的命令).              | `tinymce`  |
| [explode()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#explode) | 拆分字符,并且删除拆分后字符串的前后空额                      | `tinymce`  |
| [get(ID)](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#get) | Returns an editor instance for a given id.                   | `tinymce`  |
| [grep()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#grep) | Filters out items from the input array by calling the specified function for each item. If the function returns false the item will be excluded if it returns true it will be included. | `tinymce`  |
| [hasOwnProperty()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#hasOwnProperty) | 检查对象是否拥有指定属性                                     | `tinymce`  |
| [inArray()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#inArray) | Returns an index of the item or -1 if item is not present in the array. | `tinymce`  |
| [init()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#init) | 根据配置初始化创建编辑器                                     | `tinymce`  |
| [is()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#is) | 判断指定内容是否是,某类型                                    | `tinymce`  |
| [isArray()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#isArray) | Returns true/false if the object is an array or not.         | `tinymce`  |
| [makeMap()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#makeMap) | Makes a name/object map out of an array with names.          | `tinymce`  |
| [map()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#map) | Creates a new array by the return value of each iteration function call. This enables you to convert one array list into another. | `tinymce`  |
| [overrideDefaults()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#overrideDefaults) | 覆盖编辑器实例的默认选项                                     | `tinymce`  |
| [remove()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#remove) | 删除一个或多个编辑器窗体                                     | `tinymce`  |
| [resolve()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#resolve) | Resolves a string and returns the object from a specific structure. | `tinymce`  |
| [setActive()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#setActive) | Sets the active editor instance and fires the deactivate/activate events. | `tinymce`  |
| [toArray()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#toArray) | Converts the specified object into a real JavaScript array.  | `tinymce`  |
| [translate()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#translate) | Translates the specified string using the language pack items. | `tinymce`  |
| [triggerSave()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#triggerSave) | Calls the save method on all editor instances in the collection. This can be useful when a form is to be submitted. | `tinymce`  |
| [trim()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#trim) | Removes whitespace from the beginning and end of a string.   | `tinymce`  |
| [walk()](https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.root/#walk) | Executed the specified function for each item in a object tree. | `tinymce`  |

