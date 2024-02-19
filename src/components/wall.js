import { SIZES } from './beat';

const HEIGHT = 2.5;
const CEILING_THICKNESS = 1.5;

/**
 * Wall to dodge.
 */
AFRAME.registerComponent('wall', {
  dependencies: ['material'],

  init: function () {
    this.curveEl = document.getElementById('curve');
    this.curveFollowRig = document.getElementById('curveFollowRig');
    this.el.setObject3D('mesh', new THREE.Mesh());
    this.geometry = null;
    this.isCeiling = false;
    this.isRaycastable = false;
    this.localPosition = new THREE.Vector3();
    this.songPosition = undefined;
    this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 1000);
    this.isInteractable = true;
  },

  play: function () {
    this.el.object3D.visible = true;
  },

  tick: function (time, timeDelta) {
    const songProgress = this.curveFollowRig.components['supercurve-follow'].songProgress;

    if (this.isInteractable) {
      if (!this.isRaycastable && songProgress + 0.01 >= this.songPosition) {
        this.isRaycastable = true;
        this.el.setAttribute('data-wall-active', '');
        if (!this.isCeiling) {
          this.el.setAttribute('data-weapon-particles', '');
          this.el.setAttribute('raycastable-game', '');
        }
      }
    }

    if (songProgress >= this.backPosition + 0.01) { this.returnToPool(); }
  },

  onGenerate: function (songPosition, horizontalPosition, width, length, isCeiling, backPosition, wallInfo, _customData) {
    const el = this.el;
    this.isCeiling = isCeiling;
    this.backPosition = backPosition;
    this.songPosition = songPosition;
    this.setWallGeometry(songPosition, horizontalPosition, width, length, isCeiling, wallInfo, _customData);

    // TODO Check if this works
    this.isInteractable = window.deepGet(_customData, ['_interactable']) || true;


    let color = window.deepGet(_customData, ['_color'])

    if (color !== undefined) {
      el.getObject3D('mesh').material.uniforms.colorTertiary.value = { x: color[0], y: color[1], z: color[2] }
      // el.getObject3D('mesh').material.uniforms.opacity.value = color[3] || 0;
    } else {
      // el.getObject3D('mesh').material.uniforms.opacity.value = 0;
    }

    /* "_color": [
      42,
      42,
      42,
      0
  ], */

    // console.log('wall/onGenerate', el.getObject3D('mesh').material)
    el.object3D.position.y = -5;
    el.components.animation__fadein.beginAnimation();
    el.components.animation__scalein.beginAnimation();
  },

  /**
   * Curve wall along curve by mapping box geometry vertices along curve using.
   * supercurve.getPositionRelativeToTangent.
   */
  setWallGeometry: (function () {
    const modifiedVertexPos = new THREE.Vector3();
    const left = new THREE.Vector3();
    const right = new THREE.Vector3();

    return function (songPosition, horizontalPosition, width, length, isCeiling, wallInfo, _customData) {
      // console.log('setWallGeometry', songPosition, horizontalPosition, width, length, isCeiling, wallInfo, _customData)

      let _scale = window.deepGet(_customData, ['_scale']);

      let height = isCeiling ? CEILING_THICKNESS : HEIGHT;

      let startHeight = null;

      if (wallInfo._type >= 1000 && wallInfo._type <= 4000) {
        height = wallInfo._type / 1000;
      } else if (wallInfo._type > 40000 && wallInfo._type <= 4005000) {
        // height = wallInfo._type / 1000;
        wallInfo._type -= 4001;
        height = wallInfo._type / 1000 / 1000;
        startHeight = wallInfo._type % 1000 / 1000;
      }

      if (_scale !== undefined) {
        width = _scale[0] || width;
        height = _scale[1] || height
        length = _scale[2] || length
      }
      // console.log('width', width, 'height', height, 'length', length)



      /*       let _localRotation = window.deepGet(_customData, ['_localRotation']);
            if (_localRotation !== undefined) {
      
              this.el.getObject3D('mesh').rotation.set(
                THREE.Math.degToRad(_localRotation[0]),
                THREE.Math.degToRad(_localRotation[1]),
                THREE.Math.degToRad(_localRotation[2]),
              );
            } */

      const beatSystem = this.el.sceneEl.components['beat-system'];
      const supercurve = this.curveEl.components.supercurve;

      const lengthPercent = length / supercurve.length;
      const startPercent = songPosition;
      const endPercent = songPosition + lengthPercent;



      // Offset vectors to get the left / right vertex points to pass into curve helper.
      // Note that curve is upside down so the positions are reversed...normally, this would
      // read as `+ (width / 2) - 0.25`.
      const centerPosition = (-1 * beatSystem.horizontalPositions[horizontalPosition]) -
        (width / 2) + 0.25;
      left.x = centerPosition - (width / 2);
      right.x = centerPosition + (width / 2);

      // TODO: Reuse box.
      const geo = this.geometry = new THREE.BoxBufferGeometry(width, height, 1, 1, 1, 30);
      const positions = geo.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        // Add half length (which will always be 1 / 2) for the box geometry offset.
        // Converts box Z from [-0.5, 0.5] to [0, 1] providing a percent.
        const vertexPercent = positions[i + 2] + 0.5;
        supercurve.getPositionRelativeToTangent(
          startPercent + (vertexPercent * (endPercent - startPercent)),
          positions[i] < 0 ? left : right,
          modifiedVertexPos);

        positions[i] = modifiedVertexPos.x;
        positions[i + 1] += modifiedVertexPos.y + height / 2;
        positions[i + 2] = modifiedVertexPos.z;
      }

      // Notes are higher in punch so lower a tad.
      let ceilingHeight = beatSystem.verticalPositions.middle + beatSystem.size / 2;
      if (beatSystem.data.gameMode === 'punch') { ceilingHeight -= 0.1; }


      let _rotation = window.deepGet(_customData, ['_rotation']);
      if (_rotation !== undefined && _rotation !== 0) {
        // console.log(this.el.getObject3D('mesh'));
        if (typeof _rotation == 'number') {
          _rotation = [0, _rotation, 0]
        }
        this.el.getObject3D('mesh').rotation.set(
          THREE.Math.degToRad(_rotation[0]),
          THREE.Math.degToRad(_rotation[1]),
          THREE.Math.degToRad(_rotation[2]),
        );
      }

      // let mesh = this.el.getObject3D('mesh');

      // mesh.geometry.translate(0, 0, 0)

      // mesh.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(-mesh.position.x, -mesh.position.y, -mesh.position.z));


      /* var center = new THREE.Vector3();

      mesh.geometry.computeBoundingBox();
      mesh.geometry.boundingBox.getCenter(center);
      mesh.geometry.center();
      mesh.position.copy(center); */


      // console.log(this.el.getObject3D('mesh'));


      let _position = window.deepGet(_customData, ['_position']);

      if (_position !== undefined) {
        this.el.getObject3D('mesh').geometry = this.geometry;

        // console.log('_position', _position);

        this.el.getObject3D('mesh').position.x = beatSystem.size * (_position[0] + 2); // x

        // beatSystem.size / 2 + beatSystem.size

        const hMargin = beatSystem.gameMode === CLASSIC ? beatSystem.size : beatSystem.size * 1.2;

        this.el.getObject3D('mesh').position.y = hMargin * _position[1];  // y
      } else {

        if (horizontalPosition === 'none') {
          this.el.getObject3D('mesh').position.x = beatSystem.size * ((wallInfo._lineIndex / 1000 - 2)); // x

        }

        this.el.getObject3D('mesh').geometry = this.geometry;
        if (startHeight !== null) {
          console.log('startHeight', startHeight)
          this.el.getObject3D('mesh').position.y = startHeight * 8 * beatSystem.size;

        } else {
          this.el.getObject3D('mesh').position.y = isCeiling ? ceilingHeight : 0.1;
        }

      }

    };
  })(),

  returnToPool: function () {
    this.el.object3D.visible = false;
    this.el.removeAttribute('data-weapon-particles');
    this.el.removeAttribute('data-wall-active');
    this.el.removeAttribute('raycastable-game');
    this.isCeiling = false;
    this.isRaycastable = false;
    if (this.el.isPlaying) {
      this.el.sceneEl.components.pool__wall.returnEntity(this.el);
    }
    if (this.geometry) { this.geometry.dispose(); }
  }
});
