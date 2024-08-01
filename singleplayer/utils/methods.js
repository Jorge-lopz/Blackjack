// DECK OF CARDS API -> https://www.deckofcardsapi.com/

/* READ ME: Uses local storage to save player data, profile picture and win distribution between player and dealer */

let deckId = "";

let player = {};

const cardImages = {};

const dealer = {
  hand: [],
  handValue: 0,
  busted: false,
};

const createDeckURL = "https:www.deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6"; // 6 decks of cards, like the original game
const drawCardURL = "https://www.deckofcardsapi.com/api/deck/{deckId}/draw/?count=1";

const playerCardsContainer = document.getElementById("playerCards");
const dealerCardsContainer = document.getElementById("dealerCards");

// UTILS
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadStorage() {
  let currentPlayer = localStorage.getItem("currentPlayer");
  if (currentPlayer != null) {
    player = {
      ...(JSON.parse(localStorage.getItem(currentPlayer)) || {}),
      hand: [],
      handValue: 0,
      playing: true,
      busted: false,
    };
    playerPFP.src = localStorage.getItem(`${player.name}PFP`) || "../common/assets/pfp.png";
    document.getElementById("playerName").innerHTML = `${player.name}<br><span id="playerWins">Wins: 0</span>`;
    updateWinner();
    document.getElementById("start").disabled = false;
    document.getElementById("choosePlayer").classList.remove("active");
    document.getElementById("logout").disabled = false;
  }
}

function preloadCardImages() {
  cardImages["back"] = new Image();
  cardImages["back"].src = "https://www.deckofcardsapi.com/static/img/back.png";
  fetch(`https:www.deckofcardsapi.com/api/deck/new/draw/?count=52`)
    .then((response) => response.json())
    .then((data) => {
      data.cards.forEach((card) => {
        const img = new Image();
        img.src = card.image;
        img.onload = () => {
          cardImages[card.code] = img;
        };
      });
    })
    .catch((error) => console.error("Error preloading images:", error));
}

// USER METHODS
function selectPlayer(toRegister = false) {
  document.getElementById("nameInput").value = "";
  document.getElementById("nameInputContainer").classList.add("active");
  document.getElementById("login").classList.remove("selected");
  document.getElementById("register").classList.remove("selected");

  if (toRegister) {
    document.getElementById("sendNameButton").onclick = register;
    document.getElementById("register").classList.add("selected");
  } else {
    document.getElementById("sendNameButton").onclick = login;
    document.getElementById("login").classList.add("selected");
  }
}

function register() {
  let name = document.getElementById("nameInput").value.trim().toUpperCase();
  if (name == "") alert("Name cannot be empty");
  else if (localStorage.getItem("playerNames") != null && JSON.parse(localStorage.getItem("playerNames")).includes(name))
    alert("Name already taken");
  else {
    localStorage.setItem(
      "playerNames",
      JSON.stringify([...((localStorage.getItem("playerNames") && JSON.parse(localStorage.getItem("playerNames"))) || []), name])
    );

    localStorage.setItem(name, JSON.stringify({ name, wins: 0, dealerWins: 0 }));

    localStorage.setItem("currentPlayer", name);

    document.getElementById("nameInputContainer").classList.remove("active");
    document.getElementById("register").classList.remove("selected");

    // Load the stored information for the selected user
    loadStorage();
  }
}

function login() {
  let name = document.getElementById("nameInput").value.trim().toUpperCase();
  if (name == "") alert("Name cannot be empty");
  else if (localStorage.getItem("playerNames") != null && !JSON.parse(localStorage.getItem("playerNames")).includes(name))
    alert(`Name (${name}) not found`);
  else {
    localStorage.setItem("currentPlayer", name);

    document.getElementById("nameInputContainer").classList.remove("active");
    document.getElementById("login").classList.remove("selected");

    // Load the stored information for the selected user
    loadStorage();
  }
}

function logout() {
  localStorage.removeItem("currentPlayer");
  player = {};
  playerPFP.src = "../common/assets/pfp.png";
  document.getElementById("playerName").innerHTML = 'PLAYER<br><span id="playerWins">Wins: 0</span>';
  document.getElementById("start").disabled = true;
  document.getElementById("choosePlayer").classList.add("active");
  document.getElementById("logout").disabled = true;

  updateWinner();
}

// DEALER METHODS

async function dealerStart() {
  try {
    const response = await fetch(drawCardURL.replace("{deckId}", deckId).replace("count=1", "count=2"));
    if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);

    const data = await response.json();
    const cards = data.cards;

    for (let index = 0; index < 2; index++) {
      let newCard;
      if (index == 1) {
        newCard = cardImages["back"].cloneNode(true);
        newCard.setAttribute("card-src", cards[index].image);
      } else {
        if (cardImages[cards[index].code]) {
          newCard = cardImages[cards[index].code].cloneNode(true);
        } else {
          newCard = document.createElement("img");
          newCard.src = cards[index].image;
        }
      }
      newCard.className = "playingCard";
      newCard.style.setProperty("--order", dealerCardsContainer.childElementCount);
      newCard.draggable = false;
      dealerCardsContainer.appendChild(newCard);
      dealerCardsContainer.style.setProperty("--children", dealerCardsContainer.childElementCount);
      let card = cards[index].code.replace("0", "10").replace("D", "♦").replace("S", "♠").replace("C", "♣").replace("H", "♥");
      // If the card is an Ace, add it to the end of the hand, if not, add it to the beginning (so that aces are then evaluated last)
      if (card === "A") dealer.hand.push(card);
      else dealer.hand.unshift(card);
      dealer.handValue = getScore(dealer.hand);
      document.getElementById("dealerHandValue").innerText = dealer.handValue;
    }

    // Checks if the dealer has a blackjack
    if (dealer.handValue == 21) {
      console.log("DEALER HAS A BLACKJACK!");
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation: ", error);
  }
}

function flipCard(card) {
  return new Promise((resolve) => {
    card.classList.add("fade-out");

    card.addEventListener("transitionend", () => {
      card.src = card.getAttribute("card-src");
      card.removeEventListener("transitionend", arguments.callee);

      card.classList.remove("fade-out");
      card.classList.add("fade-in");

      setTimeout(() => {
        card.classList.remove("fade-in");
      }, 500);
    });
    setTimeout(() => {
      resolve();
    }, 900);
  });
}

async function dealerTurn() {
  await flipCard(dealerCardsContainer.querySelector("[card-src]"));
  try {
    while (dealer.handValue < 17) {
      const response = await fetch(drawCardURL.replace("{deckId}", deckId));
      if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);

      const data = await response.json();

      let newCard;
      if (cardImages[data.cards[0].code]) {
        newCard = cardImages[data.cards[0].code].cloneNode(true);
      } else {
        newCard = document.createElement("img");
        newCard.src = data.cards[0].image;
      }
      newCard.className = "playingCard";
      newCard.style.setProperty("--order", dealerCardsContainer.childElementCount);
      newCard.draggable = false;
      dealerCardsContainer.appendChild(newCard);
      dealerCardsContainer.style.setProperty("--children", dealerCardsContainer.childElementCount);

      await delay(750);

      let card = data.cards[0].code.replace("0", "10").replace("D", "♦").replace("S", "♠").replace("C", "♣").replace("H", "♥");
      // If the card is an Ace, add it to the end of the hand, if not, add it to the beginning (so that aces are then evaluated last)
      if (card === "A") dealer.hand.push(card);
      else dealer.hand.unshift(card);
      dealer.handValue = getScore(dealer.hand);
      document.getElementById("dealerHandValue").innerText = dealer.handValue;
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
function stand() {
  return new Promise((resolve) => {
    player.playing = false;
    console.log(`${player.name} STANDS`);
    resolve();
  });
}

function hit() {
  document.getElementById("stand").disabled = true;
  document.getElementById("hit").disabled = true;
  let hand = player.hand;
  return new Promise((resolve, reject) => {
    fetch(drawCardURL.replace("{deckId}", deckId))
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);
        return response.json();
      })
      .then((data) => {
        let newCard;
        if (cardImages[data.cards[0].code]) {
          newCard = cardImages[data.cards[0].code].cloneNode(true);
        } else {
          newCard = document.createElement("img");
          newCard.src = data.cards[0].image;
        }
        newCard.className = "playingCard";
        newCard.style.setProperty("--order", playerCardsContainer.childElementCount);
        newCard.draggable = false;
        playerCardsContainer.appendChild(newCard);
        playerCardsContainer.style.setProperty("--children", playerCardsContainer.childElementCount);

        let card = data.cards[0].code.replace("0", "10").replace("D", "♦").replace("S", "♠").replace("C", "♣").replace("H", "♥");
        // If the card is an Ace, add it to the end of the hand, if not, add it to the beginning (so that aces are then evaluated last)
        if (card[0] === "A") hand.push(card);
        else hand.unshift(card);
        player.handValue = getScore(hand); // Updates the player's score
        document.getElementById("playerHandValue").innerText = player.handValue;
        // Checks if the player busted or has a blackjack
        if (player.handValue > 21) {
          player.busted = true;
          player.playing = false;
          console.log(`${player.name} BUSTED!`);
          document.getElementById("bust").classList.add("active");
        } else if (player.handValue == 21) {
          console.log(`${player.name} HAS A BLACKJACK!`);
          document.getElementById("blackjack").classList.add("active");
          player.playing = false;
        }
        setTimeout(() => {
          resolve();
        }, 750);
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
  finished = false;

  document.getElementById("start").disabled = true;
  document.getElementById("stand").disabled = true;
  document.getElementById("hit").disabled = true;
  document.getElementById("chipsContainer").classList.add("shown");

  document.querySelectorAll(".value").forEach((element, index) => {
    if (index == 0) element.innerHTML = "Value: <span id='dealerHandValue'>0</span>";
    if (index == 1) element.innerHTML = "Value: <span id='playerHandValue'>0</span>";
    element.style.cssText = "";
    element.classList.add("visible");
  });

  playerCardsContainer.innerHTML = "";
  dealerCardsContainer.innerHTML = "";
  playerCardsContainer.style.setProperty("--children", 0);

  //Resets player
  player.hand = [];
  player.handValue = 0;
  player.playing = true;
  player.busted = false;

  //Resets dealer
  dealer.busted = false;
  dealer.hand = [];
  dealer.handValue = 0;

  /* UNUSED MANUAL DECK GENERATOR
  const suits = { Hearts: "♥", Spades: "♠", Clubs: "♣", Diamonds: "♦" };
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  for (const suit in suits) {
    for (const value in values) {
      deck.push(`${values[value]} ${suits[suit]}`);
    }
  }

  // Custom dotFunction to shuffle an array
  Array.prototype.shuffle = function () {
    // Fisher-Yates
    for (let i = this.length - 1; i > 0; i--) {
      const switched = Math.floor(Math.random() * (i + 1));
      [this[i], this[switched]] = [this[switched], this[i]];
    }
    return this;
  };

  deck.shuffle(); 
  */

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

function updateWinner() {
  document.getElementById("dealerWins").innerText = `Wins: ${player.dealerWins || 0}`;
  document.getElementById("playerWins").innerText = `Wins: ${player.wins || 0}`;

  const playerProfile = document.getElementById("player");
  const dealerProfile = document.getElementById("dealer");

  playerProfile.classList.remove("winner");
  dealerProfile.classList.remove("winner");

  if (player.wins > player.dealerWins) {
    playerProfile.classList.add("winner");
  } else if (player.wins < player.dealerWins) {
    dealerProfile.classList.add("winner");
  }
}

async function gameRound() {
  if (!player.playing) {
    await end();
    finished = true;
    document.getElementById("start").disabled = false;
    document.getElementById("start").style.setProperty("--text", "'PLAY AGAIN'");
  } else {
    document.getElementById("stand").disabled = false;
    document.getElementById("hit").disabled = false;
    // Wait here for the result of any of the actions executed by clinking one of the buttons enabled above
    let clickedButton = await Promise.race([waitButtonClick("stand"), waitButtonClick("hit")]);
    document.getElementById("stand").disabled = true;
    document.getElementById("hit").disabled = true;
    if (clickedButton === "stand") await stand();
    else if (clickedButton === "hit") await hit();
  }
}

function waitButtonClick(buttonId) {
  return new Promise((resolve) => {
    document.getElementById(buttonId).addEventListener("click", () => resolve(buttonId), { once: true });
  });
}

async function end() {
  let winner = "";

  // If the player has busted, the dealer doesn't have to continue playing
  if (player.busted) {
    document.querySelector(".value>#playerHandValue").parentElement.innerText = `BUSTED (${player.handValue})`;
    winner = "dealer";
  } else {
    await dealerTurn();

    // Find the winner
    let playerHand = player.handValue;
    let dealerHand = dealer.handValue;

    if (dealer.busted) {
      document.querySelector(".value>#dealerHandValue").parentElement.innerText = `BUSTED (${dealer.handValue})`;
      winner = "player";
    } else if (playerHand > dealerHand) {
      winner = "player";
    } else if (playerHand < dealerHand) {
      winner = "dealer";
    } else {
      winner = "tie";
    }
  }

  if (winner === "dealer") {
    document.getElementById("chips").classList.add("animate__animated", "animate__fadeOutUp");
    console.log("DEALER WINS!");
    let winnerValue = document.querySelector(".value>#dealerHandValue").parentElement;
    winnerValue.innerText = `WINNER (${dealer.handValue})`;
    winnerValue.style.color = "#ffd337";
    winnerValue.style.fontWeight = "500";
    player.dealerWins++;
  } else if (winner === "player") {
    document.getElementById("chips").classList.add("animate__animated", "animate__fadeOutDown");
    console.log(player.name, "WINS!");
    let winnerValue = document.querySelector(".value>#playerHandValue").parentElement;
    winnerValue.innerText = `WINNER (${player.handValue})`;
    winnerValue.style.color = "#ffd337";
    winnerValue.style.fontWeight = "500";
    player.wins++;
  } else if (winner === "tie") {
    document.getElementById("chips").classList.add("animate__animated", "animate__zoomOut");
    console.log("IT'S A TIE!");
    player.dealerWins++;
    document.querySelectorAll(".value").forEach((element) => (element.innerText = `TIE (${dealer.handValue})`));
    player.wins++;
  }

  await delay(1000);

  updateWinner();

  let playerToUpdate = JSON.parse(localStorage.getItem(player.name));
  playerToUpdate.wins = player.wins;
  playerToUpdate.dealerWins = player.dealerWins;
  localStorage.setItem(player.name, JSON.stringify(playerToUpdate));
  document.getElementById("chipsContainer").classList.remove("shown");
}
