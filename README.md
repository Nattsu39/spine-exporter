# spine-exporter
[查看中文说明](README_zh.md)

[spine](https://esotericsoftware.com/) animation exporter.

## Features
- Does not depend on spine editor software
- Full command line interface
- Can be exported in batches
- Support `.skel`/`.json` skeleton import
- Can be exported as GIF/MOV/single frame PNG/PNG sequence

## Installation
Install [Node.js](https://nodejs.org/) (version ^18.17.0 or >= 20.3.0), then:
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