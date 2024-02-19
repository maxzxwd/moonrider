/**
 * Select difficulty.
 */
AFRAME.registerComponent('menu-difficulty-select', {
  init: function () {
    this.el.sceneEl.addEventListener('menuchallengeselect', () => {
      this.el.object3D.visible = false;
      setTimeout(() => {
        this.el.components.layout.update();
        this.el.object3D.visible = true;
      }, 150);
    });
  },

  events: {
    click: function (evt) {

      let parts = evt.target.closest('.difficultyOption').dataset.id.split('-');

      let data = {
        'beatmapCharacteristic': parts[0],
        'difficulty': parts[1],
      }


      if (window.multiplayerEnabled) {
        console.log('multiplayer/broadcast/menudifficultyselect', data)
        NAF.connection.broadcastDataGuaranteed('menudifficultyselect',
          data);
      }

      this.el.sceneEl.emit(
        'menudifficultyselect',
        data,
        false);
    }
  }
});
