# 初次渲染流程

例子

```ts
const HelloVueApp = {
  data() {
    return {
      message: "Hello Vue!",
    };
  },
};

Vue.createApp(HelloVueApp).mount("#hello-vue");
```

## createApp

createApp 内部代码实现,代码位置`packages/runtime-dom/src/index.ts`

```js
export const createApp = ((...args) => {
  // 创建 app 对象
  const app = ensureRenderer().createApp(...args)

// __DEV__ 开发模式下执行
  if (__DEV__) {
    injectNativeTagCheck(app)
    injectCompilerOptionsCheck(app)
  }

  const { mount } = app
  // 重写 mount 方法 (原生mount方法是一个标准的可跨平台的组件渲染流程)
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    // 标准化容器
    // containerOrSelector如果是一个字符则会转换成DOM对象
    const container = normalizeContainer(containerOrSelector)
    if (!container) return

    const component = app._component
    if (!isFunction(component) && !component.render && !component.template) {
      // __UNSAFE__
      // Reason: potential execution of JS expressions in in-DOM template.
      // The user must make sure the in-DOM template is trusted. If it's
      // rendered by the server, the template should not contain any user data.
      // 有可能在模板中执行js表达式,所以用户必须确保模板内容是可信的,如果是服务端渲染,则
      // 模板不应包含任何用户数据
      component.template = container.innerHTML

      // 2.x compat check
      if (__COMPAT__ && __DEV__) {
        for (let i = 0; i < container.attributes.length; i++) {
          const attr = container.attributes[i]
          if (attr.name !== 'v-cloak' && /^(v-|:|@)/.test(attr.name)) {
            compatUtils.warnDeprecation(
              DeprecationTypes.GLOBAL_MOUNT_CONTAINER,
              null
            )
            break
          }
        }
      }
    }

    // 挂载前清空容器
    container.innerHTML = ''
    // 真正的挂载
    const proxy = mount(container, false, container instanceof SVGElement)
    if (container instanceof Element) {
      container.removeAttribute('v-cloak')
      container.setAttribute('data-v-app', '')
    }
    return proxy
  }

  return app
}) as CreateAppFunction<Element>
```

核心代码`ensureRenderer()`通过`createRenderer`返回一个 render 对象

```js
function ensureRenderer() {
  return (
    renderer ||
    ((renderer = createRenderer < Node),
    Element | (ShadowRoot > rendererOptions))
  );
}
```

在`packages/runtime-core/src/renderer.ts`中找到`createRenderer`
这里是调用了`baseCreateRenderer`函数来创建 Renderer

```ts
export function createRenderer<
  HostNode = RendererNode,
  HostElement = RendererElement
>(options: RendererOptions<HostNode, HostElement>) {
  return baseCreateRenderer < HostNode, HostElement > options;
}
```

`baseCreateRenderer`函数 2 千多行就不贴完整代码了。函数最后返回的是一个
`{ render, hydrate, createApp: createAppAPI(render, hydrate) }`对象，其中`createApp`是后续
马上要用到的函数，`render` 和 `hydrate` 应该是用在其他地方，先不考虑

可以发现 `createApp` 指向的是 `createAppAPI()` 的返回值

而`createAppAPI`这个函数是返回一个创建 app 对象的函数。
代码位置`packages/runtime-core/src/apiCreateApp.ts`

```ts
export function createAppAPI<HostElement>(
  render: RootRenderFunction<HostElement>,
  hydrate?: RootHydrateFunction
): CreateAppFunction<HostElement> {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = { ...rootComponent };
    }

    if (rootProps != null && !isObject(rootProps)) {
      __DEV__ && warn(`root props passed to app.mount() must be an object.`);
      rootProps = null;
    }

    const context = createAppContext();
    const installedPlugins = new Set();

    let isMounted = false;

    const app: App = (context.app = {
      _uid: uid++,
      _component: rootComponent as ConcreteComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,

      version,

      get config() {
        return context.config;
      },

      set config(v) {
        if (__DEV__) {
          warn(
            `app.config cannot be replaced. Modify individual options instead.`
          );
        }
      },

      use(plugin: Plugin, ...options: any[]) {
        if (installedPlugins.has(plugin)) {
          __DEV__ && warn(`Plugin has already been applied to target app.`);
        } else if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin);
          plugin.install(app, ...options);
        } else if (isFunction(plugin)) {
          installedPlugins.add(plugin);
          plugin(app, ...options);
        } else if (__DEV__) {
          warn(
            `A plugin must either be a function or an object with an "install" ` +
              `function.`
          );
        }
        return app;
      },

      mixin(mixin: ComponentOptions) {
        if (__FEATURE_OPTIONS_API__) {
          if (!context.mixins.includes(mixin)) {
            context.mixins.push(mixin);
          } else if (__DEV__) {
            warn(
              "Mixin has already been applied to target app" +
                (mixin.name ? `: ${mixin.name}` : "")
            );
          }
        } else if (__DEV__) {
          warn("Mixins are only available in builds supporting Options API");
        }
        return app;
      },

      component(name: string, component?: Component): any {
        if (__DEV__) {
          validateComponentName(name, context.config);
        }
        if (!component) {
          return context.components[name];
        }
        if (__DEV__ && context.components[name]) {
          warn(
            `Component "${name}" has already been registered in target app.`
          );
        }
        context.components[name] = component;
        return app;
      },

      directive(name: string, directive?: Directive) {
        if (__DEV__) {
          validateDirectiveName(name);
        }

        if (!directive) {
          return context.directives[name] as any;
        }
        if (__DEV__ && context.directives[name]) {
          warn(
            `Directive "${name}" has already been registered in target app.`
          );
        }
        context.directives[name] = directive;
        return app;
      },
      /**
       * 标准的mount函数,可跨平台的一套流程,在创建完app对象后,立刻重写了该方法
       * @param rootContainer
       * @param isHydrate
       * @param isSVG
       * @returns
       */
      mount(
        rootContainer: HostElement,
        isHydrate?: boolean,
        isSVG?: boolean
      ): any {
        if (!isMounted) {
          // #5571
          if (__DEV__ && (rootContainer as any).__vue_app__) {
            warn(
              `There is already an app instance mounted on the host container.\n` +
                ` If you want to mount another app on the same host container,` +
                ` you need to unmount the previous app by calling \`app.unmount()\` first.`
            );
          }
          //创建根组件的vnode
          const vnode = createVNode(
            rootComponent as ConcreteComponent,
            rootProps
          );
          // store app context on the root VNode.
          // this will be set on the root instance on initial mount.
          vnode.appContext = context;

          // HMR root reload
          if (__DEV__) {
            context.reload = () => {
              render(cloneVNode(vnode), rootContainer, isSVG);
            };
          }

          if (isHydrate && hydrate) {
            hydrate(vnode as VNode<Node, Element>, rootContainer as any);
          } else {
            render(vnode, rootContainer, isSVG);
          }
          isMounted = true;
          app._container = rootContainer;
          // for devtools and telemetry
          (rootContainer as any).__vue_app__ = app;

          if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
            app._instance = vnode.component;
            devtoolsInitApp(app, version);
          }

          return getExposeProxy(vnode.component!) || vnode.component!.proxy;
        } else if (__DEV__) {
          warn(
            `App has already been mounted.\n` +
              `If you want to remount the same app, move your app creation logic ` +
              `into a factory function and create fresh app instances for each ` +
              `mount - e.g. \`const createMyApp = () => createApp(App)\``
          );
        }
      },

      unmount() {
        if (isMounted) {
          render(null, app._container);
          if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
            app._instance = null;
            devtoolsUnmountApp(app);
          }
          delete app._container.__vue_app__;
        } else if (__DEV__) {
          warn(`Cannot unmount an app that is not mounted.`);
        }
      },

      provide(key, value) {
        if (__DEV__ && (key as string | symbol) in context.provides) {
          warn(
            `App already provides property with key "${String(key)}". ` +
              `It will be overwritten with the new value.`
          );
        }

        context.provides[key as string | symbol] = value;

        return app;
      },
    });

    if (__COMPAT__) {
      installAppCompatProperties(app, context, render);
    }

    return app;
  };
}
```

总结：  
先创建 render， 然后再将 render 作为参数创建 app 对象

## 挂载

重写 mount 方法

```ts
app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
  // 标准化容器
  // containerOrSelector如果是一个字符则会转换成DOM对象
  const container = normalizeContainer(containerOrSelector);
  if (!container) return;

  const component = app._component;
  // 如果组件对象没有render函数和template模板,则取innerHTML作为组件模板内容
  if (!isFunction(component) && !component.render && !component.template) {
    // __UNSAFE__
    // Reason: potential execution of JS expressions in in-DOM template.
    // The user must make sure the in-DOM template is trusted. If it's
    // rendered by the server, the template should not contain any user data.
    // 有可能在模板中执行js表达式,所以用户必须确保模板内容是可信的,如果是服务端渲染,则
    // 模板不应包含任何用户数据
    component.template = container.innerHTML;

    // 2.x compat check
    // vue2.x向后兼容
    if (__COMPAT__ && __DEV__) {
      for (let i = 0; i < container.attributes.length; i++) {
        const attr = container.attributes[i];
        if (attr.name !== "v-cloak" && /^(v-|:|@)/.test(attr.name)) {
          compatUtils.warnDeprecation(
            DeprecationTypes.GLOBAL_MOUNT_CONTAINER,
            null
          );
          break;
        }
      }
    }
  }

  // 挂载前清空容器
  container.innerHTML = "";
  // 真正的挂载
  const proxy = mount(container, false, container instanceof SVGElement);
  if (container instanceof Element) {
    container.removeAttribute("v-cloak");
    container.setAttribute("data-v-app", "");
  }
  return proxy;
};
```

调用重写后`mount`方法

```ts
app.mount("#app");
```

挂载前先通过`normalizeContainer`判断容器是否存在  
`mount`中先是通过 `normalizeContainer`获取标准化一个容器或者称之为 DOM.
通过源码发现这里的参数有 3 种类型, 通常我们都是以字符串选择器作为参数,另外的参数类型
是做不同平台使用的, 最终返回的是一个`Element`对象

```ts
function normalizeContainer(
  container: Element | ShadowRoot | string
): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container);
    if (__DEV__ && !res) {
      warn(
        `Failed to mount app: mount target selector "${container}" returned null.`
      );
    }
    return res;
  }
  if (
    __DEV__ &&
    window.ShadowRoot &&
    container instanceof window.ShadowRoot &&
    container.mode === "closed"
  ) {
    warn(
      `mounting on a ShadowRoot with \`{mode: "closed"}\` may lead to unpredictable bugs`
    );
  }
  return container as any;
}
```

调用原生 mount 方法, 创建 vnode, 渲染 vnode,并真正挂载

```ts
const proxy = mount(container, false, container instanceof SVGElement);
```

`createVNode`中创建 vnode

`render`中渲染 vnode
主要实现代码是`patch`函数
