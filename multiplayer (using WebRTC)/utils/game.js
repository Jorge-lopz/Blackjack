async function startGame() {
  await initializeGame();
  // Reset each player's hand and give each player 2 cards
  Object.values(players).forEach((player) => {
    player.hand = [];
    player.handValue = 0;
    player.playing = true;
    player.busted = false;
  });
  for (let index = 0; index < 2; index++) {
    for (const player in players) {
      await hit(player);
    }
  }
  gameLoop();
}

async function gameLoop() {
  while (!finished) {
    await gameRound(); // This will wait until gameRound completes
  }
}
