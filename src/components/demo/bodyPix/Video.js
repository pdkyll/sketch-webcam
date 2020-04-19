import {
  Mesh,
  PlaneBufferGeometry,
  RawShaderMaterial,
  Vector2,
  Vector3,
  VideoTexture,
  DataTexture,
  LuminanceFormat,
  UnsignedByteType,
  NearestFilter
} from 'three';
import MathEx from 'js-util/MathEx';

import store from '@/store';

import vs from './glsl/Video.vs';
import fs from './glsl/Video.fs';

export default class Video extends Mesh {
  constructor() {
    // Define Geometry
    const geometry = new PlaneBufferGeometry(1, 1);

    // Define Material
    const material = new RawShaderMaterial({
      uniforms: {
        resolution: {
          type: 'v2',
          value: store.state.resolution
        },
        imgRatio: {
          type: 'v2',
          value: new Vector2()
        },
        video: {
          type: 't',
          value: new VideoTexture(store.state.webcam.video)
        },
        videoResolution: {
          type: 'v2',
          value: store.state.webcam.resolution
        },
        segmentation: {
          type: 't',
          value: null
        }
      },
      vertexShader: vs,
      fragmentShader: fs
    });
    super(geometry, material);
    this.size = new Vector3();
  }
  updateSegmentation(segmentation) {
    const texture = this.material.uniforms.segmentation;
    if (texture.value === null) {
      texture.value = new DataTexture(
        segmentation.data,
        segmentation.width,
        segmentation.height,
        LuminanceFormat,
        UnsignedByteType
      );
      texture.value.magFilter = NearestFilter;
      texture.value.minFilter = NearestFilter;
    } else {
      texture.value.image.data.set(segmentation.data);
    }
    texture.value.needsUpdate = true;
  }
  resize() {
    const { camera } = store.state;

    const height = Math.abs(
      (camera.position.z - this.position.z) *
        Math.tan(MathEx.radians(camera.fov) / 2) *
        2
    );
    const width = height * camera.aspect;

    this.size.set(width, height, 1);
    this.material.uniforms.imgRatio.value.set(
      Math.min(1, this.size.x / this.size.y),
      Math.min(1, this.size.y / this.size.x)
    );
    this.scale.copy(this.size);
  }
}