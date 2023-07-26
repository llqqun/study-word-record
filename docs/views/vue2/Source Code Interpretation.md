# Vue2源码

> Version: 2.7.13

首先，从 GitHub - [vuejs/vue](https://github.com/vuejs/vue) 下载源码

使用pnpm 安装包

先打开package.json, 查看script

```md
"dev": "rollup -w -c scripts/config.js --sourcemap --environment TARGET:full-dev",
```

这里手动添加了`--sourcemap`命令

根据打包命令 scripts/config.js  -> 'full-dev' -> 'web/entry-runtime-with-compiler.ts' -> 'runtime-with-compiler.ts' -> './runtime/index'  -> ' core/index' -> './instance/index.ts'

一路向下找到入口文件位置

```js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
import type { GlobalAPI } from 'types/global-api'

function Vue(options) {
  if (__DEV__ && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

//@ts-expect-error Vue has function type
initMixin(Vue)
//@ts-expect-error Vue has function type
stateMixin(Vue)
//@ts-expect-error Vue has function type
eventsMixin(Vue)
//@ts-expect-error Vue has function type
lifecycleMixin(Vue)
//@ts-expect-error Vue has function type
renderMixin(Vue)

export default Vue as unknown as GlobalAPI
```

在  examples 文件夹下新建 demo 文件夹 后续调试都在这里测试
