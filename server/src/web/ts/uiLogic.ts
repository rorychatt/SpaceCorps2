// Divs
const mainMenuDiv = document.getElementById("main_menu_container") as HTMLElement;
const containerDiv = document.getElementById("container") as HTMLElement;
const playerInfoDiv = document.getElementById("p_info") as HTMLElement;
const clanInfoDiv = document.getElementById("c_info") as HTMLElement;
const shopDiv = document.getElementById("shop") as HTMLElement;
const auctionDiv = document.getElementById("auction") as HTMLElement;
const assemblyDiv = document.getElementById("assembly") as HTMLElement;
const quitDiv = document.getElementById("quit_container") as HTMLElement;
const playerModalDiv = document.getElementById("player_info_modal") as HTMLElement;
const shipModalDiv = document.getElementById("ship_info_modal") as HTMLElement;
const chatModalDiv = document.getElementById("chat_info_modal") as HTMLElement;
const spacemapModalDiv = document.getElementById("spacemap_info_modal") as HTMLElement;
const logModalDiv = document.getElementById("log_info_modal") as HTMLElement;
const assemblyModalDiv = document.getElementById("assembly_info_modal") as HTMLElement;

// Buttons
const returnToGameButton = document.getElementById("return_to_game_btn") as HTMLElement;
const closeButton = document.getElementById("close_btn") as HTMLElement;
const toggleMenuButton = document.getElementById("menu_btn") as HTMLElement;
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
const shipModalButton = document.getElementById("ship_modal_btn") as HTMLElement;
const shipModalQuitButton = document.getElementById("ship_modal_quit_btn") as HTMLElement;
const chatModalButton = document.getElementById("chat_modal_btn") as HTMLElement;
const chatModalQuitButton = document.getElementById("chat_modal_quit_btn") as HTMLElement;
const spacemapModalButton = document.getElementById("spacemap_modal_btn") as HTMLElement;
const spacemapModalQuitButton = document.getElementById("spacemap_modal_quit_btn") as HTMLElement;
const logModalButton = document.getElementById("log_modal_btn") as HTMLElement;
const logModalQuitButton = document.getElementById("log_modal_quit_btn") as HTMLElement;
const assemblyModalButton = document.getElementById("assembly_modal_btn") as HTMLElement;
const assemblyModalQuitButton = document.getElementById("assembly_modal_quit_btn") as HTMLElement;

toggleMenuButton.addEventListener("click", function(): void {
    if (mainMenuDiv.style.display === "none" || mainMenuDiv.style.display === "") {
        mainMenuDiv.style.display = "block";
    } else {
        mainMenuDiv.style.display = "none";
    }
});

returnToGameButton.addEventListener("click", function(): void {
    mainMenuDiv.style.display = "none";
})

closeButton.addEventListener("click", function(): void {
    containerDiv.style.display = "none";
    playerInfoDiv.style.display = "none";
    clanInfoDiv.style.display = "none";
    shopDiv.style.display = "none";
    auctionDiv.style.display = "none";
    assemblyDiv.style.display = "none";
})

playerInfoButton.addEventListener("click", function(): void {
    containerDiv.style.display = "block";
    playerInfoDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

clanInfoButton.addEventListener("click", function(): void {
    containerDiv.style.display = "block";
    clanInfoDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

shopButton.addEventListener("click", function(): void {
    containerDiv.style.display = "block";
    shopDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

auctionButton.addEventListener("click", function(): void {
    containerDiv.style.display = "block";
    auctionDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

assemblyButton.addEventListener ("click", function(): void {
    containerDiv.style.display = "block";
    assemblyDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

quitButton.addEventListener("click", function(): void {
    if (quitDiv.style.display === "none" || quitDiv.style.display === "") {
        quitDiv.style.display = "block";
    } else {
        quitDiv.style.display = "none";
    }
})

quitButtonNo.addEventListener ("click", function(): void {
    quitDiv.style.display = "none";
})

quitButtonYes.addEventListener("click", function(): void {
    alert("You logged off. This page will restart automatically");
    window.location.reload();
})

playerModalButton.addEventListener("click", function(): void {
    if (playerModalDiv.style.display === "none" || playerModalDiv.style.display === "") {
        playerModalDiv.style.display = "block";
    } else {
        playerModalDiv.style.display = "none";
    }
})

playerModalQuitButton.addEventListener("click", function(): void {
    playerModalDiv.style.display = "none";
})

shipModalButton.addEventListener("click", function() {
    if(shipModalDiv.style.display === "none" || shipModalDiv.style.display === "") {
        shipModalDiv.style.display = "block";
    } else {
        shipModalDiv.style.display = "none";
    }
})

shipModalQuitButton.addEventListener("click", function() {
    shipModalDiv.style.display = "none";
})

chatModalButton.addEventListener("click", function() {
    if(chatModalDiv.style.display === "none" || chatModalDiv.style.display === "") {
        chatModalDiv.style.display = "block";
    } else {
        chatModalDiv.style.display = "none";
    }
})

chatModalQuitButton.addEventListener("click", function() {
    chatModalDiv.style.display = "none";
})

spacemapModalButton.addEventListener("click", function() {
    if(spacemapModalDiv.style.display === "none" || spacemapModalDiv.style.display === "") {
        spacemapModalDiv.style.display = "block";
    } else {
        spacemapModalDiv.style.display = "none";
    }
})

spacemapModalQuitButton.addEventListener("click", function() {
    spacemapModalDiv.style.display = "none";
})

logModalButton.addEventListener("click", function() {
    if(logModalDiv.style.display === "none" || logModalDiv.style.display === "") {
        logModalDiv.style.display = "block";
    } else {
        logModalDiv.style.display = "none";
    }
})

logModalQuitButton.addEventListener("click", function() {
    logModalDiv.style.display = "none";
})

assemblyModalButton.addEventListener("click", function() {
    if(assemblyModalDiv.style.display === "none" || assemblyModalDiv.style.display === "") {
        assemblyModalDiv.style.display = "block";
    } else {
        assemblyModalDiv.style.display = "none";
    }
})

assemblyModalQuitButton.addEventListener("click", function() {
    assemblyModalDiv.style.display = "none";
})

// Movable DIVs
const movableDivs = document.querySelectorAll(".movable-div");

let offsetX: number, offsetY: number;
let isDragging: boolean = false;
let activeDiv: any = null;
// TODO: peredalat huyny full pod 0 any sovsem kringe
function onMouseDown(event:any) {
    isDragging = true;
    activeDiv = event.target;
    offsetX = event.clientX - activeDiv.getBoundingClientRect().left;
    offsetY = event.clientY - activeDiv.getBoundingClientRect().top;
    activeDiv.style.cursor = "grabbing";
}

function onMouseMove(event:any) {
    if (!isDragging) return;
    activeDiv.style.left = event.clientX - offsetX + "px";
    activeDiv.style.top = event.clientY - offsetY + "px";
}

function onMouseUp() {
    if(activeDiv) {
    isDragging = false;
    activeDiv.style.cursor = "grab";
    activeDiv = null;
    }
}

movableDivs.forEach(div => {
    div.addEventListener("mousedown", onMouseDown);
});

document.addEventListener("mousemove", onMouseMove);
document.addEventListener("mouseup", onMouseUp);

