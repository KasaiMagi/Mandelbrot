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
    var lastUpdate = (new Date()).getTime();
    var topLeft = self.viewport.topLeft();

    Config.activelyRendering = true;
    console.time('render timer');

    new Promise(function (resolve) {
      self.renderRows(dx, dy, topLeft, lastUpdate, imageData, 0, resolve)
    }).then(function () {
      Config.activelyRendering = false;
      console.timeEnd('render timer');
    });
  },
  renderRows: function (dx, dy, topLeft, lastUpdate, imageData, y_index, resolve) {   
    /* recursive function which renders individual */
    /* lines and handles timing of screen updates. */
    var self = this;

    if (y_index < self.canvas.height) {
      self.renderRow(dx, dy, topLeft, lastUpdate, imageData, y_index);

      var now = (new Date()).getTime();
      var timeSinceLastUpdate = now - lastUpdate;

      /* thanks to cslarsen */
      /* https://github.com/cslarsen/mandelbrot-js */
      if (timeSinceLastUpdate >= 1000.0 / CONFIG.render_fps) {
        lastUpdate = now;
        setTimeout(function () {
          self.renderRows(dx, dy, topLeft, lastUpdate, imageData, ++y_index, resolve);
        }, 0);
      } else {
        self.renderRows(dx, dy, topLeft, lastUpdate, imageData, ++y_index, resolve);
      }

    } else {
      resolve();
    }
  },
  renderRow: function (dx, dy, topLeft, lastUpdate, imageData, y_index) {
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
