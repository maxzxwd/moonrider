/**
 * Animate text number value.
 */
AFRAME.registerComponent('clock', {
    dependencies: ['text'],
    schema: {
        type: { type: 'string' },  // If clicked play.
    },

    init: function () {
    },

    update: function (oldData) {

    },

    tick: function (time, timeDelta) {

        var d = new Date();
        var s = d.getSeconds();
        var m = d.getMinutes();
        var h = d.getHours();
        let text =
            ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2); // + ":" + ("0" + s).substr(-2);


        // setInterval(time, 1000);

        this.el.setAttribute('text', { value: text });
    },
})
