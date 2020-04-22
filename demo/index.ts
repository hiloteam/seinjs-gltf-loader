/**
 * @File   : index.tsx
 * @Author : dtysky(dtysky@outlook.com)
 * @Date   : 2018-6-8 15:52:44
 * @Description:
 */
import * as Sein from 'seinjs';
window['Sein'] = Sein;

import 'seinjs-audio';
// import 'seinjs-inspector';

import './base.scss';
Sein.AliAMCExtension.useAuto = false;
Sein.AliAMCExtension.useWASM = false;
Sein.AliAMCExtension.useWebWorker = false;

window['__force_fallback_compress_textures'] = false;


// const bird = require('./assets/bird/bird.gltf');
const building = require('./assets/building/task_building_6.gltf');
// const sein = require('./assets/sein-lite/sein.gltf');
// const birdGLB = require('./assets/bird/bird.glb');
// const slogan = require('./assets/slogan/slogan.gltf');


async function main() {
  const engine = new Sein.Engine();
  const game = new Sein.Game(
    'game',
    {
      canvas: document.getElementById('container') as HTMLCanvasElement,
      clearColor: new Sein.Color(0, .6, .9, 1),
      width: window.innerWidth,
      height: window.innerHeight
    }
  );
  engine.addGame(game);

  game.resource.register('Audio', Sein.Audio.Loader);
  game.addActor('audioSystem', Sein.Audio.SystemActor);

  game.addWorld('main', Sein.GameModeActor, Sein.LevelScriptActor);

  await game.start();

  const camera = game.world.addActor('camera', Sein.PerspectiveCameraActor, {
    aspect: window.innerWidth / window.innerHeight,
    fov: 60,
    far: 1000,
    near: .01,
    position: new Sein.Vector3(-10, 0, 10)
  });
  camera.lookAt(new Sein.Vector3(0, 0, 0));

  let model = await game.resource.load({url: building, type: 'GlTF', name: 'building.gltf'})
  console.log(model);
  game.resource.instantiate('building.gltf');

  // model = await game.resource.load({url: slogan, type: 'GlTF', name: 'slogan.gltf'})
  // console.log(model);
  // game.resource.instantiate('slogan.gltf');

  // game.addActor('inspector', Sein.Inspector.Actor, {updateRate: 1});
}

main();
