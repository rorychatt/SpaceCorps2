let switchCtn = document.querySelector("#switch-cnt") as HTMLElement;
let switchC1 = document.querySelector("#switch-c1") as HTMLElement;
let switchC2 = document.querySelector("#switch-c2") as HTMLElement;
let switchCircle = document.querySelectorAll(".switch__circle") as unknown as HTMLElement[];
let switchBtn = document.querySelectorAll(".switch-btn") as unknown as HTMLElement[];
let aContainer = document.querySelector("#a-container") as HTMLElement;
let bContainer = document.querySelector("#b-container") as HTMLElement;
let allButtons = document.querySelectorAll(".submit") as unknown as HTMLElement[];

let getButtons = (e: Event) => e.preventDefault();

let changeForm = (e: Event) => {
    switchCtn.classList.add("is-gx");
    setTimeout(function () {
        switchCtn.classList.remove("is-gx");
    }, 1500);

    switchCtn.classList.toggle("is-txr");
    switchCircle[0].classList.toggle("is-txr");
    switchCircle[1].classList.toggle("is-txr");

    switchC1.classList.toggle("is-hidden");
    switchC2.classList.toggle("is-hidden");
    aContainer.classList.toggle("is-txl");
    bContainer.classList.toggle("is-txl");
    bContainer.classList.toggle("is-z200");
};

let mainF = (e: Event) => {
    for (var i = 0; i < allButtons.length; i++)
        allButtons[i].addEventListener("click", getButtons);
    for (var i = 0; i < switchBtn.length; i++)
        switchBtn[i].addEventListener("click", changeForm);
};

window.addEventListener("load", mainF);
