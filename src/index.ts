/**
 * @File   : index.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 7/31/2019, 2:34:39 PM
 * @Description:
 */
import {loader} from 'webpack';
import * as path from 'path';

import {getOptions} from './options';
import processGlTF from './processGlTF';
import {emitFile} from './utils';

async function SeinJSGlTFLoader(this: loader.LoaderContext, source: string | Buffer) {
  this.cacheable();
  const callback = this.async();

  try {
    const options = getOptions(this);

    const compressTextureOptions = options.compressTextures.enabled ? [
      {
        name: 'astc',
        required: ['WEBGL_compressed_texture_astc']
      },
      {
        name: 'pvrtc',
        required: ['WEBGL_compressed_texture_pvrtc']
      },
      {
        name: 'etc',
        required: ['WEBGL_compressed_texture_etc']
      },
      {
        name: 's3tc',
        required: ['WEBGL_compressed_texture_s3tc']
      },
      {
        name: 'fallback',
        required: []
      }
    ] : [
      {
        name: 'normal',
        required: []
      }
    ];

    const outputs: {result: string, required: string[]}[] = [];
    const outputEntries: {name: string, type: string, url: string}[] = [];
    let outputAssets = [];

    for (const textureOpts of compressTextureOptions) {
      if (textureOpts.required.length && !options.compressTextures[textureOpts.name].enabled) {
        continue;
      }

      let {type, content, filePath: fp, processedAssets, fileName} = await processGlTF(this, source, options, textureOpts);
      let result = '';

      if (options.base64.enabled && options.base64.includeGlTF) {
        let mimetype = '';
        if (type === 'gltf') {
          mimetype = 'application/json';
          content = new Buffer(content as string);
        } else {
          mimetype = 'application/octet-stream';
        }

        if (content.length < options.base64.threshold) {
          result = `"data:${mimetype || ''};base64,${content.toString('base64')}"`;
        }
      }

      if (!result) {
        let {resourcePath} = this;

        if (path.extname(resourcePath) !== path.extname(fp)) {
          resourcePath = resourcePath.replace(path.extname(resourcePath), path.extname(fp));
        }

        fp = await emitFile(this, options, {data: content, distPath: fp, filePath: resourcePath});

        result = `'${fp}'`;
      }

      
      outputAssets = outputAssets.concat(processedAssets);
      outputEntries.push({name: fileName, type: textureOpts.name, url: result});
      outputs.push({result, required: textureOpts.required});
    }

    console.log('Entries: ', outputEntries);
    console.log('Other assets: ', outputAssets);

    let finalRes = `function(game) {
    if (!window.__gltf_loader_extensions) {
      if (!game.renderer.gl) {
        game.renderer.initContext();
      }
      var gl = game.renderer.gl;

      window.__gltf_loader_extensions = {${outputs.map(({result, required}) =>`
      ${required.map(r => `${r}: gl.getExtension('${r}') || gl.getExtension('WEBKIT_${r}') || gl.getExtension('MOZ_${r}'),\n`)}`
      ).join('')}}
    }

  if (window.__force_fallback_compress_textures) {
    return ${outputs.filter(o => o.required.length === 0)[0].result};
  }
  
  ${outputs.map(({result, required}) => required.length === 0 ? `{
      return ${result};
    }
  ` : `if (${required.map(r => `window.__gltf_loader_extensions['${r}']`).join(' && ')}) {
      return ${result};
    }
  `).join('\n else ')}
  
};
    `
    callback(null, `module.exports = ${finalRes}`);
  } catch (error) {
    callback(error);
  }
}

export = SeinJSGlTFLoader;
