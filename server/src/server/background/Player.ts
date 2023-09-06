import { Entity } from "./Entity";

export class Player extends Entity {
    currentMap: string;
    socketId: string;

    public constructor(socketId: string, username: string) {
        super();
        this.name = username;
        this.currentMap = "M-1";
        this.socketId = socketId;
    }
}
