# 浏览器相关

## 禁止浏览器打开控制台调试代码

```js
function noConsole () {
    if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        document.body.innerHTML = "检测到非法调试,请关闭后刷新重试!";
    }
    setInterval(() => {
        (function () {
            return false;
        }
            .constructor('debugger')
            .call());
    }, 50);
}
```
