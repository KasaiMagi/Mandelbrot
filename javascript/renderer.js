'use strict';

import Config     from 'javascript/config';
import Mandelbrot from 'javascript/mandelbrot';
import Tools      from 'javascript/tools';
import Viewport   from 'javascript/viewport';

var CONFIG;
export default {
  activelyRendering: false,
  canvas: null,
  init: function () {
    this.canvas = document.getElementById("mandelbrot");
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.context = this.canvas.getContext("2d");
  },
  render: function (locationHash) {
    if (!locationHash) { locationHash = Tools.parseLocationHash(locationHash); }

    var self = this;

    CONFIG = Config.getConfig(locationHash);

    self.viewport = Viewport({
      bounds: {
        x: {min: CONFIG.x_min, max: CONFIG.x_max},
        y: {min: CONFIG.y_min, max: CONFIG.y_max}
      },
      width: self.canvas.width,
      height: self.canvas.height
    });
    self.viewport.bindToCanvas(self.canvas, self);

    var dx = self.viewport.delta().x;
    var dy = self.viewport.delta().y;

    var imageData = new ImageData(self.canvas.width, 1);
    var topLeft = self.viewport.topLeft();

    window.requestAnimationFrame(self.renderRows.bind(self, dx, dy, topLeft, imageData, 0));
  },
  renderRows: function (dx, dy, topLeft, imageData, y_index, timestamp) {
    /* recursive function which renders individual */
    /* lines and handles timing of screen updates. */
    if (y_index < this.canvas.height) {
      for(var i = 0; i < 50; i++) {
        if (y_index < this.canvas.height) {
          this.renderRow(dx, dy, topLeft, imageData, y_index);
          y_index++;
        }
      }

      window.requestAnimationFrame(this.renderRows.bind(this, dx, dy, topLeft, imageData, y_index));
    }
  },
  renderRow: function (dx, dy, topLeft, imageData, y_index) {
    var ITERATIONS = CONFIG.iterations;
    var SUPER_SAMPLES = CONFIG.super_samples;

    for (var x_index = 0; x_index < this.canvas.width; x_index++) {

      var crossoverIteration = 0;
      for (var sample = 0; sample < SUPER_SAMPLES; sample++) {
        var x = topLeft.x + (x_index + Math.random()) * dx;
        var y = topLeft.y + (y_index + Math.random()) * dy;

        crossoverIteration += Mandelbrot({
          c: {real: x, imaginary: y},
          z: {real: 0, imaginary: 0}
        });
      }

      var color = (255 / ITERATIONS) / SUPER_SAMPLES * crossoverIteration;

      var dataIndex = x_index * 4;
      imageData.data[dataIndex + 0] = 255;
      imageData.data[dataIndex + 1] = 255;
      imageData.data[dataIndex + 2] = 255;
      imageData.data[dataIndex + 3] = color;
    }

    this.context.putImageData(imageData, 0, y_index);
  }
};
