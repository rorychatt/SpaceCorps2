import { randomBytes } from "crypto";
import { Vector2D } from "./Spacemap";
export class Entity {
    name: string;
    currentMap: string;
    position: Vector2D;
    uuid = randomBytes(16).toString('hex')

    public constructor(name: string, position?: Vector2D) {
        this.name = name;
        this.currentMap = "M-1";
        if (position) {
            this.position = position;
        } else {
            this.position = { x: 0, y: 0 };
        }
    }
}
