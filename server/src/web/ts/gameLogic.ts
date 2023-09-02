//@ts-ignore
export const socket = io("http://localhost:3000");

console.log("Attempting to create socket...");

socket.on("connect", () => {
    console.log("Connected to the socket.io server");
});

socket.on("loginSuccessful", (data: {username: string}) => {
    console.log(`Successful login as ${data.username}, starting game...`)
})

socket.on("loginUnsuccessful", (data: {username: string}) => {
    alert(`Incorrect password for user: ${data.username}`)
})
