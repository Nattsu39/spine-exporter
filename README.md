# spine-exporter
[查看中文说明](README_zh.md)

[spine](https://zh.esotericsoftware.com/) animation exporter.

## Supported Spine Versions
| Spine Version |    Status    |           Notes            |
| :-----------: | :----------: | :------------------------: |
|     3.7.x     | Planned Support | Support is planned after 4.0.x is completed  |
|     3.8.x     |   Supported  | Only tested with 3.8.95/3.8.99 versions |
|     4.0.x     | Planned Support | Planned for support in version 1.0 |

## Features
- **No dependency on Spine editor software**
- Fully command-line interface
- Batch export capability
- Supports `.skel`/`.json` skeleton import
- Can export animations to GIF/MOV/PNG sequences/single PNG frames
- Texture unpacking feature

## Installation
Recommend using [Volta](https://volta.sh/).

Install Volta, then:
```shell
$ npm i -g spine-exporter
$ spine-export-cli --help
```
Or install manually, install [Node.js](https://nodejs.org/zh) (version requirement ~18.17 or ~20.3), then:
```shell
$ npm i spine-exporter
$ spine-export-cli --help
```


## Example
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
Files of the same asset (i.e., skeleton/texture/texture atlas) need to be placed in the same directory, as shown below:
```
Example
├─assets
|   ├─260_durnar # Asset 1
|   |     ├─build_char_260_durnar.atlas
|   |     ├─build_char_260_durnar.png
|   |     └build_char_260_durnar.skel
|   ├─258_podego # Asset 2
|   |     ├─build_char_258_podego.atlas
|   |     ├─build_char_258_podego.png
|   |     └build_char_258_podego.skel
```
The `output-path` option supports **curly brace** template strings, with the following keywords supported:
|    Keyword     |       Description       |
| :------------: | :---------------------: |
|  `assetName`   |       Asset name        |
|  `assetPath`   |    Path of the asset    |
|     `fps`      |     `fps` option        |
|    `scale`     |    `scale` option       |
| `animationName`| Name of the extracted animation |

Example:
```sh
spine-export-cli -e png -o output/{assetName}_{animationName} assets/
```

### Texture Unpacking
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
The `unpacker` command's `output-dir` option also supports the `assetPath` template string keyword.