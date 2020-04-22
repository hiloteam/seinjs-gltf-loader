/**
 * @File   : compressTextures.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 11/25/2019, 2:21:50 PM
 * @Description:
 */
import * as path from 'path';
import * as fs from 'fs';
import {pack} from 'seinjs-texture-compressor';
import PNG from './upng';

import {getAssetType, checkFileWithRules} from './utils';
import {IOptions} from './options';

export interface ICompressTextureOptions {
  name: string;
  required: string[];
}

export default async function compressTextures(
  gltf: any,
  baseDir: string,
  options: ICompressTextureOptions,
  origOptions: IOptions['compressTextures']
) {
  if (!gltf.images || gltf.images.length === 0) {
    return gltf;
  }

  const {quality, excludes, astc, pvrtc, etc, s3tc, fallback} = origOptions;
  const images = gltf.images as {uri: string, extras?: {type?: string, format?: string, isNormalMap?: boolean, useMipmaps?: boolean}}[];

  let index = -1;
  for (const image of images) {
    index += 1;
    if (checkFileWithRules(image.uri, excludes)) {
      continue;
    }

    const t = getAssetType(image.uri);
  
    if (t !== 'relative') {
      continue;
    }

    const ext = path.extname(image.uri);
    let destFormat = options.name;
    let isTransparent = false;
    let isNormalMap = false;
    let useMipmaps = true;

    if (image.extras) {
      isNormalMap = image.extras.isNormalMap || false;
      useMipmaps = image.extras.useMipmaps === false ? false : true;
      if (image.extras.type === 'HDR') {
        if (image.extras.format !== 'RGBD') {
          if (ext === '.exr') {
            // destFormat = options.hdrTransparent;
            isTransparent = true;
          } else if (ext === '.hdr') {
            // destFormat = options.hdrOpaque;
          }
        }
      } else {
        if (image.extras.format === 'RGB') {
          // destFormat = options.ldrOpaque;
        } else if (ext === '.png') {
          isTransparent = true;
          // destFormat = options.ldrTransparent;
        } else {
          // destFormat = options.ldrOpaque;
        }
      }
    } else {
      if (ext === '.png') {
        isTransparent = true;
        // destFormat = options.ldrTransparent;
      } else {
        // destFormat = options.ldrOpaque;
      }
    }
  
    if (!destFormat) {
      continue;
    }

    const destType = destFormat;
    let destEncoding = null;
    let destQuality = null;

    if (destFormat === 'fallback') {
      if (fallback.excludes && checkFileWithRules(image.uri, fallback.excludes)) {
        continue;
      }

      if (isNormalMap) {
        continue;
      }

      let destPath = image.uri.replace(ext, `-${options.name}.${isTransparent ? 'png' : 'jpg'}`);
      let destType = null;
      if (isTransparent && fallback.useRGBA4444) {
        destType = 'RGBA4444';
      } else if (!isTransparent && fallback.useRGB565) {
        destType = 'RGB565';
      }

      if (!destType) {
        continue;
      }

      console.log(`packing: ${destPath}`);

      const fp = path.join(baseDir, image.uri);

      destPath = image.uri;
      if (destType === 'RGBA4444') {
        /**
         * @todo 后续再研究
         */
        // const png = PNG.decode(fs.readFileSync(fp));
        // const source = PNG.toRGBA8(png)[0];
        // const buf = new Uint8Array(new ArrayBuffer(png.width * png.height * 2));

        // for (let x = 0; x < png.width; x += 1) {
        //   for (let y = 0; y < png.height; y += 1) {
        //     const pos = y * png.width + x;
        //     const sPos = pos * 4;
        //     const dPos = pos * 2;
        //     buf[dPos] = (source[sPos] << 4) | source[sPos + 1];
        //     buf[dPos + 1] = (source[sPos + 2] << 4) | source[sPos + 3];
        //   }  
        // }

        // const res = PNG.encodeLL([buf.buffer], png.width, png.height, 3, 1, 4);

        // const data = Buffer.from(res);
        // fs.writeFileSync(path.join(baseDir, destPath), data);
      } else {
        /**
         * @todo 如果必要再加上，目前看起来JPG省不了多少，只改目标类型
         */
      }
      
      gltf.textures.forEach(tex => {
        if (tex.source === index) {
          tex.extensions = tex.extensions || {};
          tex.extensions.Sein_textureImprove = tex.extensions.Sein_textureImprove || {};
          tex.extensions.Sein_textureImprove.textureType = destType === 'RGBA4444' ? 32819 : 33635;
        }
      });

      image.uri = destPath;

      continue;
    }
    
    if (destFormat === 'astc') {
      if (astc.excludes && checkFileWithRules(image.uri, astc.excludes)) {
        continue;
      }
      // https://developer.nvidia.com/astc-texture-compression-for-game-assets
      if (quality === 'high') {
        destEncoding = (isTransparent || isNormalMap) ? astc.formatTransparent || 'ASTC_4x4' : astc.formatOpaque || 'ASTC_6x6';
        destQuality = astc.quality || 'astcthorough';
      } else if (quality === 'medium') {
        destEncoding = (isTransparent || isNormalMap) ? astc.formatTransparent || 'ASTC_6x6' : astc.formatOpaque || 'ASTC_8x5';
        destQuality = astc.quality || 'astcmedium';
      } else {
        destEncoding = (isTransparent || isNormalMap) ? astc.formatTransparent || 'ASTC_8x5' : astc.formatOpaque || 'ASTC_8x6';
        destQuality = astc.quality || 'astcfast';
      }
    } else if (destFormat === 'pvrtc') {
      if (pvrtc.excludes && checkFileWithRules(image.uri, pvrtc.excludes)) {
        continue;
      }
      if (quality === 'low') {
        destEncoding = (isTransparent && !isNormalMap) ? pvrtc.formatTransparent || 'PVRTC1_2' : pvrtc.formatOpaque || 'PVRTC1_2_RGB';
        destQuality = pvrtc.quality || 'pvrtcbest';
      } else {
        destEncoding = (isTransparent && !isNormalMap) ? pvrtc.formatTransparent || 'PVRTC1_4' : pvrtc.formatOpaque || 'PVRTC1_4_RGB';
        destQuality = pvrtc.quality || 'pvrtcnormal';
      }
    } else if (destFormat === 'etc') {
      if (etc.excludes && checkFileWithRules(image.uri, etc.excludes)) {
        continue;
      }
      destEncoding = (isTransparent && !isNormalMap) ? etc.formatTransparent || 'ETC2_RGBA' : etc.formatOpaque || 'ETC2_RGB';
      if (quality === 'low') {
        destQuality = etc.quality || 'etcslow';
      } else {
        destQuality = etc.quality || 'etcfast';
      }
    } else if (destFormat === 's3tc') {
      if (s3tc.excludes && checkFileWithRules(image.uri, s3tc.excludes)) {
        continue;
      }
      if (quality === 'low') {
        destEncoding = (isTransparent && !isNormalMap) ? s3tc.formatTransparent || 'DXT1A' : s3tc.formatOpaque || 'DXT1';
        destQuality = s3tc.quality || 'better';
      } else {
        destEncoding = (isTransparent && !isNormalMap) ? s3tc.formatTransparent || 'DXT3' : s3tc.formatOpaque || 'DXT3';
        destQuality = s3tc.quality || 'fast';
      }
    } else {
      console.warn(`Not support format '${destFormat}', ignore......`);
      continue;
    }

    const destPath = image.uri.replace(ext, `-${options.name}.ktx`);
    console.log(`packing: ${destPath}`);
    try {
      await pack({
        type: destType,
        input: path.join(baseDir, image.uri),
        output: path.join(baseDir, destPath),
        compression: destEncoding,
        quality: destQuality,
        verbose: true,
        mipmap: useMipmaps,
        square: destType === 'pvrtc' ? '+' : 'no'
      });
      image.uri = destPath;
      console.log(`packed: ${destPath}`);
    } catch (error) {
      console.error(`Compress error: '${error.message}'`);
      continue;
    }
  }

  return gltf;
}
