// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  const gameManager = new GameManager(4, AutoInputManager, HTMLActuator,
      LocalStorageManager);
  gameManager.inputManager.begin(gameManager);
});
