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
  window.setInterval(this.move.bind(this), 0);
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

AutoInputManager.prototype.isGridEqual = function (oldGrid, newGrid) {
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      if ((oldGrid.cells[x][y] !== null || newGrid.cells[x][y] !== null) && ((oldGrid.cells[x][y] === null) !== (newGrid.cells[x][y] === null) || oldGrid.cells[x][y].value !== newGrid.cells[x][y].value)) return false;
    }
  }
  return true;
};

AutoInputManager.prototype.testDirection = function (grid, depth) {
  if (depth > 1) {
    let score = 0;
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        if (grid.cells[x][y]) {
          if (y % 2 === 0) score += (4 * y + 3 - x) * grid.cells[x][y].value;
          else score += (4 * y + x) * grid.cells[x][y].value;
        }
      }
    }
    return score;
  }
  let maxScore = 0;
  for (let i = 1; i < 4; i++) {
    const testGameManager = new GameManager(4, FakeInputManager, FakeActuator, FakeStorageManager);
    testGameManager.addRandomTile = function () { };
    testGameManager.grid = this.copyGrid(grid);
    testGameManager.move(i);
    if (!this.isGridEqual(grid, testGameManager.grid)) {
      const score = this.testDirection(testGameManager.grid, depth + 1);
      if (score > maxScore) {
        maxScore = score;
      }
    }
  }
  return maxScore;
};

AutoInputManager.prototype.move = function () {
  let maxScore = 0;
  let ret = 0;
  for (let i = 1; i < 4; i++) {
    const testGameManager = new GameManager(4, FakeInputManager, FakeActuator, FakeStorageManager);
    testGameManager.grid = this.copyGrid(this.gameManager.grid);
    testGameManager.addRandomTile = function () { };
    testGameManager.move(i);
    if (!this.isGridEqual(this.gameManager.grid, testGameManager.grid)) {
      const score = this.testDirection(testGameManager.grid, 0);
      if (score > maxScore) {
        maxScore = score;
        ret = i;
      }
    }
  }
  this.emit("move", ret);
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
