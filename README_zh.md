# spine-exporter
> 该项目最初是为了[赛尔计划](https://sp.61.com/)而编写的，愿阵线秩序永存。<br>
> ~~加入[茶楼]喵~加入[茶楼]谢谢喵\~~~

[spine](https://zh.esotericsoftware.com/)动画导出器。

## 特色功能
- 不依赖spine编辑器软件
- 完全命令行界面
- 可批量导出
- 支持`.skel`/`.json`骨架导入
- 支持导出为GIF/MOV/单帧PNG/PNG序列

## 安装
安装[Node.js](https://nodejs.org/zh)（版本需求^18.17.0 或 >= 20.3.0），然后：
```shell
$ npm i spine-exporter
$ spine-export-cli --help
```

## 示例
```
$ spine-export-cli --help

spine-export-cli [options] <inputDir>

Render and export the animation.
Note that the 'render' mentioned does not mean rendering something to the
screen, but is just a step in exporting the animation.

Positionals:
  inputDir  Assets will be imported from this directory and its subdirectories,
            and .png/.atlas with the same name as .skel must be included in the
            same directory as .skel.                                    [string]

Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
  -o, --output-path         The path to output the rendering result, see
                            examples.
                        [string] [default: "output/{assetName}/{animationName}"]
  -e, --export-type         Specify how to export rendering results.
                  [string] [required] [choices: "gif", "png", "sequence", "mov"]
  -c, --canvas-size         Canvas size. Content that exceeds the canvas size
                            will not be rendered. Large sizes will significantly
                            reduce rendering speed.
                                                 [string] [default: "1000x1000"]
  -s, --selected-animation  If set, only the animations in the parameters will
                            be rendered, by default all will be rendered.
                                                           [array] [default: []]
  -f, --fps                 Rendering frame rate, invalid when --exportType is
                            'png'.                        [number] [default: 30]
      --end-position        If set, rendering will end at the specified frame.
                                                    [number] [default: Infinity]

Examples:
  spine-export-cli --export-type gif        Render assets in ./assets/ and
  assets/                                   export to GIF.
  spine-export-cli -e png -o                Render the assets in ./assets/ and
  output/{assetName}/{animationName}        export the first frame. Assume the
  assets/                                   asset name is 'foo', the animation
                                            name is 'bar', and the exported file
                                            is 'foo_bar.png'
  spine-export-cli -e sequence -o           Render the first five frames of the
  output/{assetName}/{animationName}        assets in ./assets/ and export them
  assets/                                   as a png sequence. The sequence file
                                            name is '{animationName}_%d.png'.
```
[茶楼]: https://wiki.biligame.com/seerplan/%E7%A4%BE%E5%9B%A2:%E8%8C%B6%E6%A5%BC