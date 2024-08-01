// DECK OF CARDS API -> https://www.deckofcardsapi.com/

finished = false;
let deckId = "";

const players = {};

const dealer = {
  wins: 0,
  hand: [],
  handValue: 0,
  busted: false,
};

const createDeckURL = "https:www.deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6"; // 6 decks of cards, like the original game
const drawCardURL = "https://www.deckofcardsapi.com/api/deck/{deckId}/draw/?count=1";

// DEALER METHODS
async function dealerTurn() {
  try {
    while (dealer.handValue < 17) {
      const response = await fetch(drawCardURL.replace("{deckId}", deckId));
      if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);

      const data = await response.json();
      // TODO -> Card image recovery
      let card = data.cards[0].code.replace("0", "10").replace("D", "♦").replace("S", "♠").replace("C", "♣").replace("H", "♥");
      // If the card is an Ace, add it to the end of the hand, if not, add it to the beginning (so that aces are then evaluated last)
      if (card === "A") dealer.hand.push(card);
      else dealer.hand.unshift(card);
      dealer.handValue = getScore(dealer.hand);
      // Checks if the dealer busted
      if (dealer.handValue > 21) {
        console.log("DEALER BUSTED!");
        dealer.busted = true;
      } else if (dealer.handValue == 21) {
        console.log("DEALER HAS A BLACKJACK!");
      }
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation: ", error);
  }
}

// PLAYER METHODS
function addPlayer() {
  let name = prompt("What is your name?", `Player ${Object.keys(players).length}`);

  if (name != null) {
    players[name] = {
      wins: 0,
      hand: [],
      handValue: 0,
      playing: true,
      busted: false,
    };
  }

  if (Object.keys(players).length > 0) {
    document.getElementById("start").removeAttribute("disabled");
  }
}

function getPlayers(playing = [true], busted = [false]) {
  return Object.keys(players).filter(
    (playerName) => playing.includes(players[playerName].playing) && busted.includes(players[playerName].busted)
  );
}

function hitOrStand(player) {
  return new Promise((resolve, reject) => {
    if (confirm(`${player}: ${players[player].handValue} Do you want to hit?`)) {
      hit(player)
        .then(() => resolve())
        .catch((error) => reject(error));
    } else {
      players[player].playing = false;
      console.log(`${player} STANDS`);
      resolve();
    }
  });
}

function hit(player) {
  let hand = players[player].hand;
  return new Promise((resolve, reject) => {
    fetch(drawCardURL.replace("{deckId}", deckId))
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);
        return response.json();
      })
      .then((data) => {
        // TODO -> Card image recovery
        let card = data.cards[0].code.replace("0", "10").replace("D", "♦").replace("S", "♠").replace("C", "♣").replace("H", "♥");
        // If the card is an Ace, add it to the end of the hand, if not, add it to the beginning (so that aces are then evaluated last)
        if (card[0] === "A") hand.push(card);
        else hand.unshift(card);
        players[player].handValue = getScore(hand); // Updates the player's score
        // Checks if the player busted or has a blackjack
        if (players[player].handValue > 21) {
          players[player].busted = true;
          players[player].playing = false;
          console.log(`${player} BUSTED!`);
        } else if (players[player].handValue == 21) {
          console.log(`${player} HAS A BLACKJACK!`);
          players[player].playing = false;
        }

        resolve(); // Resolve the promise after everything is done
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// CARD METHODS
function getValue(card, currentScore) {
  card = card.slice(0, -1);
  let value = Number(card);
  if (!isNaN(value)) return value;
  else if (card === "A") return currentScore + 11 <= 21 ? 11 : 1;
  else return 10;
}

function getScore(hand) {
  let score = 0;
  for (const card of hand) {
    score += getValue(card, score);
  }
  return score;
}

// GAME ACTIONS
function initializeGame() {
  // Disables 'Add Player' button and the 'Start' button itself
  document.getElementById("addPlayer").disabled = true;
  document.getElementById("removePlayer").disabled = true;
  document.getElementById("start").disabled = true;

  // Generates random deck of cards (With the Deck of Cards API)
  return new Promise((resolve, reject) => {
    fetch(createDeckURL)
      .then((response) => {
        // Ensure the response has a status code between 200-299 (Successful)
        if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);
        return response.json();
      })
      .then((data) => {
        deckId = data.deck_id;
        resolve();
      })
      .catch((error) => reject(error));
  });
}

async function gameRound() {
  for (const player in players) {
    if (!checkRemainingPlayers()) {
      finished = true;
      await end();
      break;
    }
    if (players[player].playing && !players[player].busted) {
      console.log(player, " -> ", players[player]);
      await hitOrStand(player);
    }
  }
}

function checkRemainingPlayers() {
  // Check number of active players, if none remain, the game is over
  let activePlayers = getPlayers();
  if (activePlayers.length == 0) {
    return false;
  }
  return true;
}

async function end() {
  await dealerTurn();

  // Find the winner among all the players, actively playing or not (but not busted)
  let winner = [];
  let highestScore = 0;
  for (const playerName of getPlayers([true, false])) {
    let player = players[playerName];
    let playerScore = player.handValue;

    if (playerScore > highestScore && playerScore <= 21) {
      highestScore = playerScore;
      winner = [playerName];
    } else if (playerScore == highestScore) {
      winner.push(playerName);
    }
  }
  // Dealer check
  let dealerScore = dealer.handValue;
  if (dealerScore > highestScore && dealerScore <= 21) {
    highestScore = dealerScore;
    winner = ["Dealer"];
  } else if (dealerScore == highestScore) {
    winner.push("Dealer");
  }

  // Prints the winner
  if (winner.length == 1) {
    if (winner[0] == "Dealer") {
      dealer.wins++;
      console.log(`WINNER: Dealer`);
    } else {
      players[winner[0]].wins++;
      console.log(`WINNER: ${winner[0]}`);
    }
  } else if (winner.length > 1) {
    // Tie logic
    console.log(`TIE: ${winner.join(", ")}`);
    winner.forEach((playerName) => {
      if (playerName == "Dealer") {
        dealer.wins++;
      } else {
        players[playerName].wins += 1;
      }
    });
  }
  // console.log("Players: ", players);
  // console.log("Dealer", dealer);
}
