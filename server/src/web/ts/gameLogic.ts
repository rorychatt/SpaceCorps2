//@ts-ignore
export const socket = io("http://localhost:3000");

let loginDiv = document.getElementById('loginDiv') as HTMLElement


socket.on("connect", () => {
    console.log("Connected to the socket.io server");
});

socket.on("loginSuccessful", (data: {username: string}) => {
    loginDiv.hidden = true
    console.log(`Successful login as ${data.username}, starting game...`)

})

socket.on("loginUnsuccessful", (data: {username: string}) => {
    alert(`Incorrect password for user: ${data.username}`)
})
