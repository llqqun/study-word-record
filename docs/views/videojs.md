# videojs 视频播放插件

[官方网站](https://videojs.com/getting-started)

支持hls等流播放
version: 8.3

注意事项:

移动端播放M3U8视频不支持ip跨域访问

## 使用

```js
import videojs from 'video.js'
import zhcn from 'video.js/dist/lang/zh-CN.json' // 汉化语言包
import 'video.js/dist/video-js.css'

// 语言包要想先加载入配置才能使用

const player = videojs(element, options, () => {
    console.log('初始化结束')
})

```

## 配置

```js
const options = {
          poster: '', // 封面
          autoplay: true, // 设置自动播放
          muted: false, // 静音
          language: 'zhcn', // 使用语言
          languages: { zhcn }, // 加载语言包
          preload: 'auto', // 预加载
          controls: true, // 显示播放的控件
          playbackRates: [0.5, 1, 1.5, 2, 2.5], // 播放倍率
          suppressNotSupportedError: true,
          playsinline: true,
          webkitPlaysinline: true,
          sources: [
            { src: '', type: 'mp4,' } //type:  播放m3u8使用 application/x-mpegURL
          ],
          html5: {
            vhs: {
              overrideNative: true
            }
          },
          controlBar: {
            remainingTimeDisplay: { displayNegative: false },
            volumePanel: {
              inline: false
            }
          }
        }
```

## 事件

```js
// 全屏事件
player.on('fullscreenchange', () => {}) 
// 时间变化事件
player.on('timeupdate', () => {})
// 暂停
player.on('pause', () => {})
// 播放
player.on('play', () => {})
// 结束
player.on('ended', () => {})
```

## 注意

播放M3U8视频,注意视频源的跨域问题,会导致视频播放不了

在移动端使用和PC端使用会有不一样的差异,不同设备需要进行兼容处理

```js
// 根据m3u8文件内容生成清晰度列表
initQualityLevels () {
      fetch(this.videoSrc, { method: 'GET' }).then((res) => {
        return res.text()
      }).then((data) => {
        const qualityLevelArr = []
        const catchArr = data.split('#')
        catchArr.forEach((item) => {
          if (item.startsWith('EXT-X-STREAM-INF:')) {
            item = item.replace('EXT-X-STREAM-INF:', '')
            const strInfo = item.split('\n')
            const obj = {}
            strInfo[0].split(',').forEach((str) => {
              const ls = str.split('=')
              if (ls.length > 1) {
                obj[ls[0]] = ls[1]
              }
            })
            const qualityLevel = {
              id: strInfo[1],
              bt: obj.BANDWIDTH,
              width: obj.RESOLUTION.split('x')[0],
              height: obj.RESOLUTION.split('x')[1]
            }
            qualityLevelArr.push(qualityLevel)
          }
        })
        console.log(qualityLevelArr)
      })
    }
```
