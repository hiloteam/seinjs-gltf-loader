/**
 * @File   : processGlTF.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 7/31/2019, 2:45:44 PM
 * @Description:
 */
import * as path from 'path';
import * as fs from 'fs';
import * as mime from 'mime';
import {loader} from 'webpack';

import {IOptions} from './options';
import preProcessGLTFAsync from './preProcessGLTFAsync';
import {checkFileWithRules, readFileBuffer, getMd5, getAssetType, emitFile, getCommonDir} from './utils';
import compressTextures, { ICompressTextureOptions } from './compressTextures';
const gltfToGlb = require('./gltf2glb/gltfToGlb');

export interface IProcessResult {
  type: 'gltf' | 'glb';
  filePath: string;
  content: string | Buffer;
  processedAssets: string[];
  fileName: string;
}

export default async function processGlTF(
  context: loader.LoaderContext,
  source: string | Buffer,
  options: IOptions,
  compressTextureOpts: ICompressTextureOptions
): Promise<IProcessResult> {
  const {resourcePath} = context;
  const fileName = path.basename(resourcePath, path.extname(resourcePath));
  console.log(`seinjs-gltf-loader: ${fileName}, ${compressTextureOpts.name}`);

  let rootDir = (context.rootContext || (context as any).options.context) + '/';
  let srcDir = path.dirname(resourcePath);
  const commonDir = getCommonDir([srcDir, rootDir]) + '/';
  const tmp = path.parse(srcDir.replace(commonDir, ''));
  const distDir = tmp.dir;

  const md5 = getMd5(source);
  const isGlTF = path.extname(resourcePath) === '.gltf';
  const processedAssets = [];

  // glb
  if (!isGlTF) {
    const filePath = path.join(distDir, fileName + '-' + md5 + '.glb');

    return {type: 'glb', filePath, content: fs.readFileSync(resourcePath), processedAssets, fileName};
  }

  let gltfContent: any = null;
  let compressed;
  if (options.compress.enabled && !checkFileWithRules(resourcePath, options.compress.excludes)) {
    console.log('compressing...');
    compressed = await preProcessGLTFAsync(true, resourcePath, rootDir, options.compress.quantization);
  } else {
    compressed = await preProcessGLTFAsync(false, resourcePath, rootDir, options.compress.quantization);
  }
  gltfContent = compressed.json;
  srcDir = compressed.dir;

  if (options.compressTextures.enabled && compressTextureOpts.name !== 'normal') {
    gltfContent = await compressTextures(gltfContent, srcDir, compressTextureOpts, options.compressTextures);
  }

  if (options.glb.enabled && !checkFileWithRules(resourcePath, options.glb.excludes)) {
    const {glb} = await gltfToGlb(gltfContent, {
      resourceDirectory: srcDir,
      separateCustom: (fileName: string) => {
        return checkFileWithRules(path.resolve(srcDir, fileName), options.glb.excludes)
      },
      prepareNonSeparateResources: async(uri: string, buf: Buffer) => {
        if (options.process.enabled) {
          for (let index = 0; index < options.process.processors.length; index += 1) {
            const processor = options.process.processors[index];
            if (checkFileWithRules(uri, [processor.test])) {
              buf = await processor.process({data: buf, filePath: uri});
            }
          }
        }

        return buf;
      },
      prepareSeparateResource: async (uri: string, buf: Buffer) => {
        let fp = path.join(distDir, uri);
        if (options.process.enabled) {
          for (let index = 0; index < options.process.processors.length; index += 1) {
            const processor = options.process.processors[index];
            if (checkFileWithRules(uri, [processor.test])) {
              buf = await processor.process({data: buf, filePath: uri});
            }
          }
        }
        const ext = path.extname(fp);
        const md5 = getMd5(buf);
        const distPath = fp.replace(ext, '-' + md5 + ext);
        fp = await emitFile(context, options, {data: buf, distPath, filePath: uri});
        processedAssets.push(fp);

        return fp;
      }
    });

    const fp = path.join(distDir, fileName + '-' + compressTextureOpts.name + '-' + getMd5(glb) + '.glb');

    return {type: 'glb', filePath: fp, content: glb, processedAssets, fileName};
  }

  const filePath = path.join(distDir, fileName + '-' + compressTextureOpts.name + '-' + md5 + '.gltf');
  const actions: Promise<any>[] = [];
 
  const buffers = gltfContent.buffers || [];
  for (let i = 0; i < buffers.length; i += 1) {
    actions.push(processAsset(context, options, buffers[i], srcDir, distDir));
  }
  const images = gltfContent.images || [];
  for (let i = 0; i < images.length; i += 1) {
    actions.push(processAsset(context, options, images[i], srcDir, distDir));
  }
  const shaders = (((gltfContent.extensions || {}).KHR_techniques_webgl || {}).shaders || []);
  for (let i = 0; i < shaders.length; i += 1) {
    actions.push(processAsset(context, options, shaders[i], srcDir, distDir));
  }

  const audios = ((gltfContent.extensions || {}).Sein_audioClips || {}).clips || [];
  for (let i = 0; i < audios.length; i += 1) {
    actions.push(processAsset(context, options, audios[i], srcDir, distDir));
  }

  await Promise.all(actions).then(uris => {
    processedAssets.push(...uris);
  });

  compressed.removeTmp();

  return {type: 'gltf', filePath, content: JSON.stringify(gltfContent), processedAssets, fileName};
}

async function processAsset(
  context:  loader.LoaderContext,
  options: IOptions,
  obj: {uri: string},
  srcDir: string,
  distDir: string
) {
  const t = getAssetType(obj.uri);
  
  /**
   * @todo: support absolute path
   */
  if (t !== 'relative') {
    return;
  }

  const filePath = path.resolve(srcDir, obj.uri);
  return readFileBuffer(filePath)
    .then(async (data: Buffer) => {
      context.addDependency(path.resolve(context.context, obj.uri));

      if (options.process.enabled) {
        for (let index = 0; index < options.process.processors.length; index += 1) {
          const processor = options.process.processors[index];
          if (checkFileWithRules(filePath, [processor.test])) {
            data = await processor.process({data, filePath});
          }
        }
      }

      if (options.base64.enabled && data.length < options.base64.threshold) {
        if (!checkFileWithRules(filePath, options.base64.excludes)) {
          const mimetype = mime.getType(filePath);
          return `data:${mimetype || ''};base64,${data.toString('base64')}`;
        }
      }

      const tmp = path.parse(obj.uri);
      const prefix = tmp.dir ? tmp.dir.split('/') : [];
      prefix.push(tmp.name, getMd5(data));
      const fp = path.join(distDir, prefix.join('-') + tmp.ext);

      return emitFile(context, options, {data, distPath: fp, filePath});
  })
  .then(uri => {
    obj.uri = uri;

    return uri;
  });
}
