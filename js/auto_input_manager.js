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
    let n = 0;
    if (grid.cells[0][3] && grid.cells[1][3] && grid.cells[0][3].value < grid.cells[1][3]) n = 1;
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        if (grid.cells[x][y]) {
          if (y === 3) score += (15 - x) * grid.cells[x][y].value;
          else if (y % 2 === n) score += (4 * y + x) * grid.cells[x][y].value;
          else score += (4 * y + 3 - x) * grid.cells[x][y].value;
        }
      }
    }
    return score;
  }
  let maxScore = 0;
  let i = 1;
  if (!grid.cells[3][3]) {
    i++;
  } else {
    for (let j = 0; j < 3; j++) {
      if (!grid.cells[j][3]) {
        i += 2;
        break;
      }
    }
  }
  for (; i < 4; i++) {
    const testGameManager = new GameManager(4, FakeInputManager, FakeActuator, FakeStorageManager);
    testGameManager.addRandomTile = function () { };
    testGameManager.grid = this.copyGrid(grid);
    testGameManager.move(i);
    if (!this.isGridEqual(grid, testGameManager.grid) && testGameManager.grid.cells[0][3]) {
      const score = this.testDirection(testGameManager.grid, depth + 1);
      if (score > maxScore) {
        maxScore = score;
      }
    }
  }
  return maxScore;
};

AutoInputManager.prototype.move = function () {
  let maxScore = -1;
  let ret = 0;
  let i = 1;
  if (!this.gameManager.grid.cells[3][3]) {
    i++;
    ret++;
  } else {
    for (let j = 0; j < 3; j++) {
      if (!this.gameManager.grid.cells[j][3]) {
        this.emit("move", 3);
        return;
      }
    }
  }
  for (; i < 4; i++) {
    const testGameManager = new GameManager(4, FakeInputManager, FakeActuator, FakeStorageManager);
    testGameManager.grid = this.copyGrid(this.gameManager.grid);
    testGameManager.addRandomTile = function () { };
    testGameManager.move(i);
    if (!this.isGridEqual(this.gameManager.grid, testGameManager.grid) && !(!testGameManager.grid.cells[0][3] && this.gameManager.grid.cells[0][3])) {
      const score = this.testDirection(testGameManager.grid, 0);
      if (score > maxScore) {
        maxScore = score;
        ret = i;
      }
    }
  }
  if (ret === 0) {
    this.emit("move", 0);
    this.emit("move", 2);
  } else {
    this.emit("move", ret);
  }
  if (this.gameManager.over) {
    console.log(this.gameManager.score)
    this.emit("restart");
  } else if (this.gameManager.won) {
    this.emit("keepPlaying");
  }
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
