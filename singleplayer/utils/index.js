const playerPFP = document.querySelector("#player>div>img");

addEventListener("DOMContentLoaded", () => {
  loadStorage();
  preloadCardImages();

  if (localStorage.getItem("currentPlayer") == null) {
    localStorage.setItem("playerNames", JSON.stringify([]));
  }
});

document.getElementById("nameInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    document.getElementById("sendNameButton").click();
  }
});

document.getElementById("blackjack").addEventListener("animationend", () => {
  setTimeout(() => {
    document.getElementById("blackjack").classList.remove("active");
  }, 750);
});
document.getElementById("bust").addEventListener("animationend", () => {
  setTimeout(() => {
    document.getElementById("bust").classList.remove("active");
  }, 750);
});
document.getElementById("chips").addEventListener("animationend", () => {
  setTimeout(() => {
    document.getElementById("chips").classList.remove("animate__zoomOut", "animate__fadeOutDown", "animate__fadeOutUp");
  }, 1500);
});

function uploadProfilePicture(input) {
  const file = input.files[0];

  if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
      playerPFP.src = reader.result;
      localStorage.setItem(`${player.name}PFP`, reader.result);
    };
  }
}
