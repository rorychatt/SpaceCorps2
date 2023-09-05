const toggleMenuButton = document.getElementById("menu_btn") as HTMLElement;
const mainMenuDiv = document.getElementById("main_menu_container") as HTMLElement;
const returnToGameButton = document.getElementById("return_to_game_btn") as HTMLElement;
const closeButton = document.getElementById("close_btn") as HTMLElement;
const containerDiv = document.getElementById("container") as HTMLElement;
const playerInfoDiv = document.getElementById("p_info") as HTMLElement;
const clanInfoDiv = document.getElementById("c_info") as HTMLElement;
const shopDiv = document.getElementById("shop") as HTMLElement;
const auctionDiv = document.getElementById("auction") as HTMLElement;
const assemblyDiv = document.getElementById("assembly") as HTMLElement;
const quitDiv = document.getElementById("quit_container") as HTMLElement;
const playerModalDiv = document.getElementById("player_info_modal") as HTMLElement;
const playerInfoButton = document.getElementById("p_info_btn") as HTMLElement;
const clanInfoButton = document.getElementById("clan_info_btn") as HTMLElement;
const shopButton = document.getElementById("shop_btn") as HTMLElement;
const auctionButton = document.getElementById("auction_btn") as HTMLElement;
const assemblyButton = document.getElementById("assembly_btn") as HTMLElement;
const quitButton = document.getElementById("quit_btn") as HTMLElement;
const quitButtonYes = document.getElementById("quit_btn_yes") as HTMLElement;
const quitButtonNo = document.getElementById("quit_btn_no") as HTMLElement;
const playerModalButton = document.getElementById("player_modal_btn") as HTMLElement;
const playerModalQuitButton = document.getElementById("modal_quit_btn") as HTMLElement;

toggleMenuButton.addEventListener("click", function() {
    if (mainMenuDiv.style.display === "none" || mainMenuDiv.style.display === "") {
        mainMenuDiv.style.display = "block";
    } else {
        mainMenuDiv.style.display = "none";
    }
});

returnToGameButton.addEventListener("click", function() {
    mainMenuDiv.style.display = "none";
})

closeButton.addEventListener("click", function() {
    containerDiv.style.display = "none";
    playerInfoDiv.style.display = "none";
    clanInfoDiv.style.display = "none";
    shopDiv.style.display = "none";
    auctionDiv.style.display = "none";
    assemblyDiv.style.display = "none";
})

playerInfoButton.addEventListener("click", function() {
    containerDiv.style.display = "block";
    playerInfoDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

clanInfoButton.addEventListener("click", function() {
    containerDiv.style.display = "block";
    clanInfoDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

shopButton.addEventListener("click", function() {
    containerDiv.style.display = "block";
    shopDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

auctionButton.addEventListener("click", function() {
    containerDiv.style.display = "block";
    auctionDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

assemblyButton.addEventListener ("click", function() {
    containerDiv.style.display = "block";
    assemblyDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

quitButton.addEventListener("click", function() {
    if (quitDiv.style.display === "none" || quitDiv.style.display === "") {
        quitDiv.style.display = "block";
    } else {
        quitDiv.style.display = "none";
    }
})

quitButtonNo.addEventListener ("click", function() {
    quitDiv.style.display = "none";
})

quitButtonYes.addEventListener("click", function() {
    alert("You logged off. This page will restart automatically");
    window.location.reload();
})

playerModalButton.addEventListener("click", function() {
    if (playerModalDiv.style.display === "none" || playerModalDiv.style.display === "") {
        playerModalDiv.style.display = "block";
    } else {
        playerModalDiv.style.display = "none";
    }
})

playerModalQuitButton.addEventListener("click", function() {
    playerModalDiv.style.display = "none";
})