# spine-exporter
> 该项目最初是为了[赛尔计划](https://sp.61.com/)而编写的，愿阵线秩序永存。<br>
> ~~加入[茶楼]喵~加入[茶楼]谢谢喵\~~~

[spine](https://zh.esotericsoftware.com/)动画导出器。

## 支持的Spine版本
| Spine版本 |   状态   |          注释           |
| :-------: | :------: | :---------------------: |
|   3.7.x   | 计划支持 |   优先级排在4.0.x之后   |
|   3.8.x   |  支持中  | 仅测试3.8.95/3.8.99版本 |
|   4.0.x   | 计划支持 |    计划在1.0版本支持    |

## 特色功能
- **不依赖spine编辑器软件**
- 完全命令行界面
- 可批量导出
- 支持`.skel`/`.json`骨架导入
- 可将动画导出为GIF/MOV/PNG序列/单帧PNG
- 纹理解包功能

## 安装
安装[Node.js](https://nodejs.org/zh)（版本需求^18.17.0 或 >= 20.3.0），然后：
```shell
$ npm i spine-exporter
$ spine-export-cli --help
```

## 示例
### 导出动画
```
spine-export-cli [options] <inputDir>

Render and export the animation.
Note that the 'render' mentioned does not mean rendering something to the       
screen, but is just a step in exporting the animation.

命令：
  spine-export-cli export [options]         Render and export the animation.    
  <inputDir>                                Note that the 'render' mentioned    
                                            does not mean rendering something to
                                            the screen, but is just a step in   
                                            exporting the animation.    [默认值]
  spine-export-cli unpacker [options]       Load the texture atlas and then     
  <inputDir>                                unpack the texture.

选项：
      --help                         显示帮助信息                         [布尔]
      --version                      显示版本号                           [布尔]
      --inputDir                     Assets will be imported from this directory
                                     and its subdirectories, and .png/.atlas    
                                     with the same name as .skel must be
                                     included in the same directory as .skel.
                                                                 [字符串] [必需]
  -o, --output-path                  The path to output the rendering result,
                                     see examples.
                         [字符串] [默认值: "output/{assetName}/{animationName}"]
  -e, --export-type                  Specify how to export rendering results.
                       [字符串] [必需] [可选值: "gif", "png", "sequence", "mov"]
  -c, --canvas-size                  If set, old-style cropping is used, i.e.
                                     content that exceeds the canvas size will
                                     not be rendered. By default, AABB's min-max
                                     vertex positioning rendering range is used.
                                                         [字符串] [默认值: null]
  -s, --selected-animation           If set, only the animations in the
                                     parameters will be rendered, by default all
                                     will be rendered.       [数组] [默认值: []]
      --pre-multiplied-alpha, --pma  Whether to premultiply alpha when loading
                                     texture, try changing this option if the
                                     rendering result is incorrect.
                                                          [布尔] [默认值: false]
      --scale                        Scale the skeleton size, default is 1x.
                                                              [数字] [默认值: 1]
  -f, --fps                          Rendering frame rate, invalid when
                                     --exportType is 'png'.  [数字] [默认值: 30]
      --end-position                 If set, rendering will end at the specified
                                     frame.            [数字] [默认值: Infinity]
      --exporter-max-concurrent      Maximum number of concurrencies for export
                                     functions                [数字] [默认值: 2]

示例：
  spine-export-cli --export-type gif        Render assets in ./assets/ and
  assets/                                   export to GIF.
  spine-export-cli -e png -o                Render the assets in ./assets/ and
  output/{assetName}_{animationName}        export the first frame. Assume the
  assets/                                   asset name is 'foo', the animation
                                            name is 'bar', and the exported file
                                            is 'foo_bar.png'
  spine-export-cli -e sequence -o           Render the first five frames of the
  output/{assetName}/{animationName}        assets in ./assets/ and export them
  assets/                                   as a png sequence. The sequence file
                                            name is '{animationName}_%d.png'.
```
需要将同一个资源的文件（即骨骼/纹理/纹理图集）放在相同目录下，如下所示：
```
示例
├─assets
|   ├─260_durnar #资源1
|   |     ├─build_char_260_durnar.atlas
|   |     ├─build_char_260_durnar.png
|   |     └build_char_260_durnar.skel
|   ├─258_podego #资源2
|   |     ├─build_char_258_podego.atlas
|   |     ├─build_char_258_podego.png
|   |     └build_char_258_podego.skel
```
`output-path`选项支持使用**大括号**模板字符串，以下是支持的关键字：
|     关键字      |        描述        |
| :-------------: | :----------------: |
|   `assetName`   |      资源名称      |
|   `assetPath`   |    资源所在路径    |
|      `fps`      |     `fps`选项      |
|     `scale`     |    `scale`选项     |
| `animationName` | 当前提取的动画名称 |

示例：
```sh
spine-export-cli -e png -o output/{assetName}_{animationName} assets/
```

### 纹理解包
```
spine-export-cli unpacker [options] <inputDir>

Load the texture atlas and then unpack the texture.

选项：
      --help                         显示帮助信息                         [布尔]
      --version                      显示版本号                           [布尔]
      --inputDir                     Texture will be imported from this
                                     directory and its subdirectories. The atlas
                                     with the same name as the Texture must be
                                     contained in the same directory as the
                                     Texture.                    [字符串] [必需]
  -o, --output-dir                   Textures output path.
                                        [字符串] [默认值: "{assetPath}/images/"]
      --pre-multiplied-alpha, --pma  Specifies whether premultiplied alpha is
                                     preserved when exporting textures, if not,
                                     unpremultiplied alpha is exported (which is
                                     lossy).              [布尔] [默认值: false]
```
`unpacker`命令的`output-dir`选项也支持`assetPath`模板字符串关键字。

[茶楼]: https://wiki.biligame.com/seerplan/%E7%A4%BE%E5%9B%A2:%E8%8C%B6%E6%A5%BC