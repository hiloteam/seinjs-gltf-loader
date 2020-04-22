# seinjs-gltf-loader

```shell
npm i seinjs-gltf-loader --save
```

## Using

Webpack config:

```js
{
  test: /\.(gltf|glb)$/,
  use: [
    {
      loader: 'seinjs-gltf-loader',
      options: {
        // Prefix for all assets, defaults to 'output.publicPath'
        publicPath?: string;
        // Only valid when file is '.gltf'
        compress?: {
          // Enable compression
          enabled: boolean;
          // Rules for excluding unnecessary files
          excludes?: (RegExp | ((path: string) => boolean))[],
          // more options
        };
        /* If compress textures
        * Enable this option will make loader generates different gltf/glb entries for iOS(pvrtc)/Android(astc)/NotSupport(png/jpg).
        * Then will use `getExtension` to decide which one will be exported.
        * A boolean `window.__force_fallback_compress_textures` also can be used to fallback texture yourself.
        */
        compressTextures?: {
          enabled: boolean;
          /**
           * @default 'medium'
           */
          quality?: 'high' | 'medium' | 'low';
          /**
           * Rules for excluding unnecessary files
           */
          excludes?: (RegExp | ((path: string) => boolean))[];
          /**
           * Customize ASTC options
           * 
           * @default {enabled:true}
           */
          astc?: {
            enabled?: boolean;
            formatOpaque?: string;
            formatTransparent?: string;
            quality?: 'astcfast' | 'astcmedium' | 'astcthorough';
            excludes?: (RegExp | ((path: string) => boolean))[];
          };
          /**
           * Customize PVRTC options
           * 
           * @default {enabled:true}
           */
          pvrtc?: {
            enabled?: boolean;
            formatOpaque?: 'PVRTC1_4' | 'PVRTC1_4';
            formatTransparent?: 'PVRTC1_2_RGB' | 'PVRTC1_4_RGB';
            quality?: 'pvrtcbest' | 'pvrtnormal';
            excludes?: (RegExp | ((path: string) => boolean))[];
          };
          /**
           * Customize ETC options
           * 
           * @default {enabled:false}
           */
          etc?: {
            enabled?: boolean;
            formatOpaque?: 'ETC2_RGB';
            formatTransparent?: 'ETC2_RGBA';
            quality?: 'etcfast' | 'etcslow';
            excludes?: (RegExp | ((path: string) => boolean))[];
          };
          /**
           * Customize S3TC options
           * 
           * @default {enabled:false}
           */
          s3tc?: {
            enabled?: boolean;
            formatOpaque?: 'DXT1' | 'DXT3' | 'DXT5';
            formatTransparent?: 'DXT1A' | 'DXT3'| 'DXT5';
            quality?: 'fast' | 'normal' | 'better';
            excludes?: (RegExp | ((path: string) => boolean))[];
          };
          /**
           * Customize fallback options
           */
          fallback?: {
            useRGBA4444?: boolean;
            useRGB565?: boolean;
            excludes?: (RegExp | ((path: string) => boolean))[];
          };
        };
        base64?: {
          // Enable base64
          enabled: boolean;
          // Default to 1000
          threshold?: number;
          // If allow the GlTF/GLB files to base64
          includeGlTF?: boolean;
          // Rules for excluding unnecessary files
          excludes?: (RegExp | ((path: string) => boolean))[],
        };
        glb?: {
          // Enable pack to glb
          enabled: boolean;
          // Rules for excluding unnecessary files
          excludes?: (RegExp | ((path: string) => boolean))[],
        };
        // Pre process files before emit it
        process?: {
          // Enable process
          enabled: boolean;
          // You custom processors
          processors: {
            test?: RegExp | ((path: string) => boolean),
            process(options: {data: Buffer | string, filePath: string}): Promise<Buffer>;
          }[];
        };
        // for publishing your resource to cdn
        publish?: {
          // Enable publish
          enabled: boolean;
          // Rules for excluding unnecessary files
          excludes?: (RegExp | ((path: string) => boolean))[];
          // You custom publisher
          publisher: {
            publish(options: {data: Buffer | string, filePath: string, distPath: string}): Promise<string>;
          };
        };
      }
    }
  ]
}
```

Load gltf/glb file:

```js
import someGlTF from 'path/to/file.gltf';
 
```

```ts
const someGlTF from 'path/to/file.gltf';
```
