# CSS 代码效果测试

## 插件演示 vuepress-plugin-demo-code

::: demo
<div @click="onClick">Click me!</div>

<script>
export default {
  methods: {
    onClick: () => { window.alert(1) },
  },
}
</script>
:::



## 测试 1: 基本 CSS 样式

### 代码示例

```css
.test-box {
  width: 200px;
  height: 200px;
  background-color: #4CAF50;
  color: white;
  text-align: center;
  line-height: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.test-box:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
```

### 效果展示

<div class="test-box" style="
  width: 200px;
  height: 200px;
  background-color: #4CAF50;
  color: white;
  text-align: center;
  line-height: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  margin: 20px 0;
">
  鼠标悬停查看效果
</div>

<style>
  .test-box:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
</style>

## 测试 2: 复杂 CSS 效果

### 代码示例

```css
.gradient-box {
  width: 300px;
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
```

### 效果展示

<div style="
  width: 300px;
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: pulse 2s infinite;
  margin: 20px 0;
">
  渐变背景与动画效果
</div>

<style>
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
