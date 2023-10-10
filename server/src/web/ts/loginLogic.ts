import { socket } from "./gameLogic.js";

let switchCtn = document.querySelector("#switch-cnt") as HTMLElement;
let switchC1 = document.querySelector("#switch-c1") as HTMLElement;
let switchC2 = document.querySelector("#switch-c2") as HTMLElement;
let switchCircle = document.querySelectorAll(
    ".switch__circle"
) as unknown as HTMLElement[];
let switchBtn = document.querySelectorAll(
    ".switch-btn"
) as unknown as HTMLElement[];
let aContainer = document.querySelector("#a-container") as HTMLElement;
let bContainer = document.querySelector("#b-container") as HTMLElement;
let allButtons = document.querySelectorAll(
    ".submit"
) as unknown as HTMLElement[];

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

document.addEventListener("keydown", (event) => {
    if(event.key === "Enter") {
        if(bContainer.classList.contains("is-txl")) {
            const username = (
                document.getElementById("loginUsername") as HTMLInputElement
            ).value;
            const password = (
                document.getElementById("loginPassword") as HTMLInputElement
            ).value;
            if(username && password) {
                socket.emit("authenticate", { username: username, password: password });
            }
        }
    }
});

const loginBtn: HTMLElement | null = document.getElementById("signin");
loginBtn?.addEventListener("click", (event: Event) => {
    event.preventDefault()
    const username = (
        document.getElementById("loginUsername") as HTMLInputElement
    ).value;
    const password = (
        document.getElementById("loginPassword") as HTMLInputElement
    ).value;
    if(username && password) {
        socket.emit("authenticate", { username: username, password: password });
    }
});

const registerBtn: HTMLElement | null = document.getElementById("signup");
registerBtn?.addEventListener("click", (event: Event) => {
    event.preventDefault()
    console.log("Attempting to register...")
    const username = (document.getElementById("registerUsername") as HTMLInputElement).value
    const password = (document.getElementById("registerPassword") as HTMLInputElement).value
    if(username && password) {
        if(username.length <= 0 || password.length <= 0) return;
        socket.emit("attemptRegister", {username: username, password: password});
    }
});
