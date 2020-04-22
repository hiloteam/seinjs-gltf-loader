/**
 * @File   : utils.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 7/31/2019, 4:50:01 PM
 * @Description:
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { loader } from 'webpack';
import * as cp from 'ncp';

import { IOptions } from './options';

export async function emitFile(
  context: loader.LoaderContext,
  options: IOptions,
  params: { data: Buffer | string, distPath: string, filePath: string }
): Promise<string> {
  if (!options.publish.enabled || checkFileWithRules(params.filePath, options.publish.excludes)) {
    context.emitFile(params.distPath, params.data, null);

    return path.join(options.publicPath, params.distPath);
  }

  return await options.publish.publisher.publish(params);
}

export async function copyFile(from: string, to: string) {
  return new Promise((resolve, reject) => {
    fs.copyFile(from, to, err => {
      if (err) {
        return reject(err);
      }

      resolve();
    })
  });
};

export async function readFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: 'utf8' }, (err, content: string) => {
      if (err) {
        reject(err)
      } else {
        resolve(content);
      }
    })
  })
};

export async function readFileBuffer(filePath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, content: Buffer) => {
      if (err) {
        reject(err)
      } else {
        resolve(content);
      }
    })
  })
};

export async function writeFile(filePath: string, buffer: Buffer) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, err => {
      if (err) {
        reject(err);
      } else {
        resolve(filePath);
      }
    })
  })
};

cp.limit = 16;
cp.stopOnErr = true;
export async function copyDir(src: string, dest: string) {
  return new Promise((resolve, reject) => {
    cp(src, dest, err => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      resolve();
    });
  });
}

export function checkFileWithRules(
  filePath: string,
  rules: (RegExp | ((path: string) => boolean))[]
): boolean {
  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];

    if (rule instanceof RegExp) {
      rule.lastIndex = 0;
      if (rule.test(filePath)) {
        return true;
      }
    } else if (rule(filePath)) {
      return true;
    }
  }

  return false;
}

export function getMd5(buf: Buffer | string) {
  return crypto.createHash('md5').update(buf).digest('hex').slice(0, 5);
}

export function getAssetType(uri: string): 'absolute' | 'base64' | 'relative' {
  if (/^http/i.test(uri)) {
    return 'absolute';
  } else if (/^data:[^;]+;base64,/.test(uri)) {
    return 'base64';
  } else {
    return 'relative';
  }
}

const splitStrings = (a, sep = '/') => a.map(i => i.split(sep));
const elAt = i => a => a[i];
const rotate = a => a[0].map((e, i) => a.map(elAt(i)));
const allElementsEqual = arr => arr.every(e => e === arr[0]);
export function getCommonDir(strs: string[], sep: string = '/') {
  return rotate(splitStrings(strs, sep))
      .filter(allElementsEqual).map(elAt(0)).join(sep)
}
