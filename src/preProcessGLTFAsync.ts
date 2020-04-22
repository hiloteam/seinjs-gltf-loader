/**
 * @File   : preProcessGLTFAsync.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 7/31/2019, 3:52:30 PM
 * @Description:
 */
const compressAsync = require('amc/build/compressGLTF');
import * as tmp from 'tmp';
import * as path from 'path';
import * as fs from 'fs';
import * as shell from 'shelljs';

import {IOptions} from './options';
import {readFile, copyFile, copyDir} from './utils';


export default async function preProcessGLTFAsync(
  compress: boolean,
  inputPath: string,
  rootDir: string,
  quantization: IOptions['compress']['quantization'],
) {
  const filename = path.basename(inputPath);
  const sourceDir = path.dirname(inputPath);
  const targetDir = path.join((tmp as any).dirSync().name, sourceDir.replace(rootDir, ''));

  if (!fs.existsSync(targetDir)) {
    shell.mkdir('-p', targetDir);
  }

  const removeTmp = () => {
    shell.rm('-rf', targetDir);
  };

  const targetFilePath = path.join(targetDir, filename);

  if (!compress) {
    await copyDir(sourceDir, targetDir);
    console.log(`Copy from '${sourceDir}' to '${targetDir}'`);

    return {
      removeTmp,
      filename: targetFilePath,
      json: JSON.parse(await readFile(inputPath)),
      dir: targetDir
    };
  }

  try {
    await compressAsync(inputPath, targetFilePath, {
      quantization: Object.assign({
        POSITION: 13,
        NORMAL: 8,
        TEXCOORD: 10,
        TEXCOORD_1: 10,
        JOINT: 6,
        WEIGHT: 6,
        TANGENT: 10,
      }, quantization)
    });

    const gltfJSON = JSON.parse(await readFile(targetFilePath));

    await Promise.all((gltfJSON.images || []).map(obj => copyFile(
      path.join(sourceDir, obj.uri),
      path.join(targetDir, obj.uri),
    )));

    await Promise.all((((gltfJSON.extensions || {}).Sein_audioClips || {}).clips || []).map(obj => copyFile(
      path.join(sourceDir, obj.uri),
      path.join(targetDir, obj.uri)
    )));

    return {
      removeTmp,
      filename: targetFilePath,
      json: gltfJSON,
      dir: targetDir,
    }
  } catch (error) {
    console.warn('Compression failed', error);
    await copyDir(sourceDir, targetDir);
    console.log(`Copy from '${sourceDir}' to '${targetDir}'`);

    return {
      removeTmp,
      filename: targetFilePath,
      json: JSON.parse(await readFile(inputPath)),
      dir: targetDir
    }
  }
}
