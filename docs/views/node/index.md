# node问题  

## import导入JSON文件报错

```js
const pkg = await import('file://' + pkgPath).then((v) => {
        return v.default
    })
```

运行报错

```cmd
Module "file:///D:/test/custom-cli/testProject/package.json" needs an import assertion of type "json"
```

解决方案

导入断言是 ECMAScript 2021 (ES12) 中引入的一项功能，它允许开发人员指定有关要导入的模块的其他元数据。这些断言在 Node.js 版本 14.0.0 及更高版本中可用
使用导入断言，您可以指定有关正在导入的模块的元数据，例如其完整性校验和或其媒体类型。导入断言的语法如下

```js
import defaultExport from 'module' assert { assertion };
import * as namedExports from 'module' assert { assertion };
import { namedExport } from 'module' assert { assertion };
```

```js
const pkg = await import('file://' + pkgPath, {assert: { type: 'json'}}).then((v) => {
        return v.default
    })
```
