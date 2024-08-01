async function startGame() {
  finished = false;

  await initializeGame();

  dealerStart();

  // Deal the player the first 2 cards
  for (let index = 0; index < 2; index++) {
    await hit(player);
  }

  // Starts game loop
  gameLoop();
}

async function gameLoop() {
  while (!finished) {
    await gameRound();
  }
}
