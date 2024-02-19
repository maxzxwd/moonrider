var utils = require('../utils');

const PREVIEW_VOLUME = 0.5;

/**
 * Song previews.
 */
AFRAME.registerComponent('song-preview-system', {
  schema: {
    previewStartTime: { type: 'int' },
    selectedChallengeId: { type: 'string' }, // ! In reality, this is directDownload
    hash: { type: 'string' }
  },

  init: function () {
    this.audio = document.createElement('audio');
    this.audio.volume = PREVIEW_VOLUME;

    this.el.addEventListener('ziploaderend', evt => {
      const audioSrc = evt.detail.audio;
      this.audio.pause();

      const data = this.data;

      if (data.selectedChallengeId /* && oldData.selectedChallengeId !== data.selectedChallengeId */) {

        this.audio.setAttribute('src', audioSrc);
        this.audio.currentTime = window.deepGet(evt.detail, ['info', '_previewStartTime']) || data.previewStartTime || 12;
        console.log('previewStart', this.audio.currentTime);
        // console.log('load end ', data) // _previewStartTime
        this.audio.play();
      }
    });
  },

  update: function (oldData) {
    const data = this.data;
    if (!data.selectedChallengeId || oldData.selectedChallengeId !== data.selectedChallengeId) {

      this.audio.pause();
    }
  },
});
