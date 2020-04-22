/**
 * @File   : options.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 7/31/2019, 2:46:53 PM
 * @Description:
 */
import {loader} from 'webpack';
import * as loaderUtils from 'loader-utils';

export interface IOptions {
  // Prefix for all assets, defaults to 'output.publicPath'
  publicPath?: string;
  // Only valid when file is '.gltf'
  compress?: {
    // Enable compression
    enabled: boolean;
    // Rules for excluding unnecessary files
    excludes?: (RegExp | ((path: string) => boolean))[];
    // more options
    quantization?: {
      // eg. POSITION: 13
      [attribute: string]: number;
    };
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
    excludes?: (RegExp | ((path: string) => boolean))[];
  };
  glb?: {
    // Enable pack to glb
    enabled: boolean;
    // Rules for excluding unnecessary files
    excludes?: (RegExp | ((path: string) => boolean))[];
  };
  process?: {
    // Enable process
    enabled: boolean;
    // You custom processors
    processors: {
      test?: RegExp | ((path: string) => boolean),
      process(options: {data: Buffer | string, filePath: string}): Promise<Buffer>;
    }[];
  };
  publish?: {
    // Enable publish
    enabled: boolean;
    // Rules for excluding unnecessary files
    excludes?: (RegExp | ((path: string) => boolean))[];
    // You custom publisher
    publisher: {
      publish(options: {data: Buffer | string, filePath: string, distPath: string}): Promise<string>;
    };
  }
}

const DEFAULT_OPTIONS: IOptions = {
  publicPath: '/',
  compress: {
    enabled: false,
    excludes: [],
    quantization: {}
  },
  compressTextures: {
    enabled: false,
    quality: 'medium',
    astc: {
      enabled: true,
      formatOpaque: null,
      formatTransparent: null,
      quality: null,
      excludes: []
    },
    pvrtc: {
      enabled: true,
      formatOpaque: null,
      formatTransparent: null,
      quality: null,
      excludes: []
    },
    etc: {
      enabled: false,
      formatOpaque: null,
      formatTransparent: null,
      quality: null,
      excludes: []
    },
    s3tc: {
      enabled: false,
      formatOpaque: null,
      formatTransparent: null,
      quality: null,
      excludes: []
    },
    fallback: {
      useRGBA4444: true,
      useRGB565: true,
      excludes: []
    },
    excludes: []
  },
  base64: {
    enabled: false,
    threshold: 1000,
    includeGlTF: false,
    excludes: []
  },
  glb: {
    enabled: false,
    excludes: []
  },
  process: {
    enabled: false,
    processors: []
  },
  publish: {
    enabled: false,
    excludes: [],
    publisher: null
  }
};

export function getOptions(context: loader.LoaderContext) {
  let options: IOptions = loaderUtils.getOptions(context) || {};

  options.compressTextures = options.compressTextures || {} as any;

  return {
    publicPath: options.publicPath || context._compiler.options.output.publicPath || DEFAULT_OPTIONS.publicPath,
    compress: {
      ...DEFAULT_OPTIONS.compress,
      ...(options.compress || {})
    },
    compressTextures: {
      ...DEFAULT_OPTIONS.compressTextures,
      ...(options.compressTextures || {}),
      ...{
        astc: {
          ...DEFAULT_OPTIONS.compressTextures.astc,
          ...(options.compressTextures.astc || {}),
        },
        pvrtc: {
          ...DEFAULT_OPTIONS.compressTextures.pvrtc,
          ...(options.compressTextures.pvrtc || {}),
        },
        fallback: {
          ...DEFAULT_OPTIONS.compressTextures.fallback,
          ...(options.compressTextures.fallback || {})
        }
      }
    },
    base64: {
      ...DEFAULT_OPTIONS.base64,
      ...(options.base64 || {})
    },
    glb: {
      ...DEFAULT_OPTIONS.glb,
      ...(options.glb || {})
    },
    process: {
      ...DEFAULT_OPTIONS.process,
      ...(options.process || {})
    },
    publish: {
      ...DEFAULT_OPTIONS.publish,
      ...(options.publish || {})
    }
  }
}
