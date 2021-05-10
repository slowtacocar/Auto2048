function AutoInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchend = "MSPointerUp";
  } else {
    this.eventTouchend = "touchend";
  }

  this.listen();
}

AutoInputManager.prototype.begin = function (gameManager) {
  this.gameManager = gameManager;
  window.requestAnimationFrame(this.nextFrame.bind(this));
};

AutoInputManager.prototype.copyGrid = function (grid) {
  const newGrid = new Grid(grid.size);
  for (let x = 0; x < grid.size; x++) {
    for (let y = 0; y < grid.size; y++) {
      const oldTile = grid.cells[x][y];
      if (oldTile) {
        newGrid.cells[x][y] = new Tile({x: oldTile.x, y: oldTile.y}, oldTile.value);
      }
    }
  }
  return newGrid;
};

AutoInputManager.prototype.getDirection = function (grid) {
  let maxScore = 0;
  let ret = Math.floor(Math.random() * 4);
  for (let i = 0; i < 4; i++) {
    const score = this.testDirection(this.copyGrid(grid), i, 0, 0);
    if (score > maxScore) {
      maxScore = score;
      ret = i;
    }
  }
  return ret;
};

AutoInputManager.prototype.testDirection = function (grid, direction, score, depth) {
  if (depth > 3) return 0;
  const testGameManager = new GameManager(4, FakeInputManager, FakeActuator, FakeStorageManager);
  testGameManager.grid = grid;
  testGameManager.score = score;
  testGameManager.move(direction);
  let maxScore = testGameManager.score;
  for (let i = 0; i < 4; i++) {
    let total = 0;
    for (let j = 0; j < 5; j++) {
      total += this.testDirection(this.copyGrid(testGameManager.grid.cells), i, testGameManager.score, depth + 1);
    }
    if (total / 10 > maxScore) {
      maxScore = score;
    }
  }
  return maxScore;
};

AutoInputManager.prototype.nextFrame = function () {
  this.emit("move", this.getDirection(this.gameManager.grid));
  window.requestAnimationFrame(this.nextFrame.bind(this));
};

AutoInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

AutoInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

AutoInputManager.prototype.listen = function () {
  var self = this;

  // Respond to direction keys
  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
        event.shiftKey;

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });

  // Respond to button presses
  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);
};

AutoInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

AutoInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

AutoInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};
