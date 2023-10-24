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
const chatModelDivClass = document.querySelector(".chat_info_modal") as HTMLElement;
const spacemapModalDiv = document.getElementById("spacemap_info_modal") as HTMLElement;
const logModalDiv = document.getElementById("log_info_modal") as HTMLElement;
const assemblyModalDiv = document.getElementById("assembly_info_modal") as HTMLElement;
const questbookModalDiv = document.getElementById("questbook_info_modal") as HTMLElement;
const questbookDiv = document.getElementById("questbook") as HTMLElement;

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
const questbookModalButton = document.getElementById("active_quest_modal_btn") as HTMLElement;
const questbookModalQuitButton = document.getElementById("questbook_modal_quit_btn") as HTMLElement;
const questbookButton = document.getElementById("questbook_btn") as HTMLElement;


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
    questbookDiv.style.display = "none";
})

playerInfoButton.addEventListener("click", function(): void {
    containerDiv.style.display = "block";
    playerInfoDiv.style.display = "block";
    mainMenuDiv.style.display = "none";
})

questbookButton.addEventListener("click", function(): void {
    containerDiv.style.display = "block";
    questbookDiv.style.display = "block";
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

questbookModalButton.addEventListener("click", function() {
    questbookModalDiv.classList.remove('hidden');
    questbookModalDiv.classList.add('shown');
})

questbookModalQuitButton.addEventListener("click", function() {
    questbookModalDiv.classList.remove('shown');
    questbookModalDiv.style.animation = 'fadeOutAndCollapse 0.5s ease-in-out forwards';
    setTimeout(function() {
        questbookModalDiv.style.animation = 'fadeInOutAndExpand 0.5s ease-in-out forwards';
        questbookModalDiv.classList.add('hidden');
    }, 501);
})

playerModalButton.addEventListener("click", function() {
    playerModalDiv.classList.remove('hidden');
    playerModalDiv.classList.add('shown');
})

playerModalQuitButton.addEventListener("click", function() {
    playerModalDiv.classList.remove('shown');
    playerModalDiv.style.animation = 'fadeOutAndCollapse 0.5s ease-in-out forwards';
    setTimeout(function() {
        playerModalDiv.style.animation = 'fadeInOutAndExpand 0.5s ease-in-out forwards';
        playerModalDiv.classList.add('hidden');
    }, 501);
})

shipModalButton.addEventListener("click", function() {
    shipModalDiv.classList.remove('hidden');
    shipModalDiv.classList.add('shown');
})

shipModalQuitButton.addEventListener("click", function() {
    shipModalDiv.classList.remove('shown');
    shipModalDiv.style.animation = 'fadeOutAndCollapse 0.5s ease-in-out forwards';
    setTimeout(function() {
        shipModalDiv.style.animation = 'fadeInOutAndExpand 0.5s ease-in-out forwards';
        shipModalDiv.classList.add('hidden');
    }, 501);
})

chatModalButton.addEventListener("click", function() {
    chatModalDiv.classList.remove('hidden');
    chatModalDiv.classList.add('shown');
})

chatModalQuitButton.addEventListener("click", function() {
    chatModalDiv.classList.remove('shown');
    chatModalDiv.style.animation = 'fadeOutAndCollapse 0.5s ease-in-out forwards';
    setTimeout(function() {
        chatModalDiv.style.animation = 'fadeInOutAndExpand 0.5s ease-in-out forwards';
        chatModalDiv.classList.add('hidden');
    }, 501);
})

spacemapModalButton.addEventListener("click", function() {
    spacemapModalDiv.classList.remove('hidden');
    spacemapModalDiv.classList.add('shown');
})

spacemapModalQuitButton.addEventListener("click", function() {
    spacemapModalDiv.classList.remove('shown');
    spacemapModalDiv.style.animation = 'fadeOutAndCollapse 0.5s ease-in-out forwards';
    setTimeout(function() {
        spacemapModalDiv.style.animation = 'fadeInOutAndExpand 0.5s ease-in-out forwards';
        spacemapModalDiv.classList.add('hidden');
    }, 501);
})

logModalButton.addEventListener("click", function() {
    logModalDiv.classList.remove('hidden');
    logModalDiv.classList.add('shown');
})

logModalQuitButton.addEventListener("click", function() {
    logModalDiv.classList.remove('shown');
    logModalDiv.style.animation = 'fadeOutAndCollapse 0.5s ease-in-out forwards';
    setTimeout(function() {
        logModalDiv.style.animation = 'fadeInOutAndExpand 0.5s ease-in-out forwards';
        logModalDiv.classList.add('hidden');
    }, 501);
})

assemblyModalButton.addEventListener("click", function() {
    assemblyModalDiv.classList.remove('hidden');
    assemblyModalDiv.classList.add('shown');
})

assemblyModalQuitButton.addEventListener("click", function() {
    assemblyModalDiv.classList.remove('shown');
    assemblyModalDiv.style.animation = 'fadeOutAndCollapse 0.5s ease-in-out forwards';
    setTimeout(function() {
        assemblyModalDiv.style.animation = 'fadeInOutAndExpand 0.5s ease-in-out forwards';
        assemblyModalDiv.classList.add('hidden');
    }, 501);
})

// Movable DIVs
const modal = document.querySelector(".movable-div") as HTMLElement;
let isDragging = false;
let isResizing = false;
let offsetX = 0;
let offsetY = 0;
let initialWidth = modal.offsetWidth;
let initialHeight = modal.offsetHeight;

modal?.addEventListener("mousedown", (e: MouseEvent) => {
  const resizeHandleSize = 10; 
  const rect = modal.getBoundingClientRect();

  if (
    e.clientX >= rect.right - resizeHandleSize &&
    e.clientY >= rect.bottom - resizeHandleSize
  ) {
    isResizing = true;
    initialWidth = rect.width;
    initialHeight = rect.height;
  } else if (
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom
  ) {
    isDragging = true;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  }
});

document.addEventListener("mousemove", (e: MouseEvent) => {
  if (isResizing) {
    const newWidth = initialWidth + (e.clientX - offsetX - modal.getBoundingClientRect().left);
    const newHeight = initialHeight + (e.clientY - offsetY - modal.getBoundingClientRect().top);
    if (newWidth > 0 && newHeight > 0) {
      modal.style.width = newWidth + "px";
      modal.style.height = newHeight + "px";
    }
  } else if (isDragging) {
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    if (newLeft > 0 && newTop > 0 && newLeft + modal.offsetWidth < window.innerWidth && newTop + modal.offsetHeight < window.innerHeight) {
      modal.style.left = newLeft + "px";
      modal.style.top = newTop + "px";
    }
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
});

const elements = document.querySelectorAll(".movable");

elements.forEach((element: Element) => {
  const htmlElement = element as HTMLElement; // Приводим тип к HTMLElement
  htmlElement.addEventListener("mousedown", (e: MouseEvent) => {
    let isDragging = true;
    const rect = htmlElement.getBoundingClientRect();
    let offsetX = e.clientX - rect.left;
    let offsetY = e.clientY - rect.top;

    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (isDragging) {
        htmlElement.style.left = e.clientX - offsetX + "px";
        htmlElement.style.top = e.clientY - offsetY + "px";
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  });
});