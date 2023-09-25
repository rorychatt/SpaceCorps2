import { randomBytes } from "crypto";
import { PortalLocations, Spacemap, SpacemapSize, Vector2D } from "./Spacemap";
export class Entity {
    name: string;
    position: Vector2D;
    currentMap: string;
    uuid = randomBytes(16).toString("hex");

    public constructor(currentMap: string, name: string, position?: Vector2D) {
        this.name = name;
        this.currentMap = currentMap;
        if (position) {
            this.position = position;
        } else {
            this.position = { x: 0, y: 0 };
        }
    }
}

export class Portal extends Entity {
    location: PortalLocations;
    destination: string;
    mapSize: SpacemapSize;
    _type: String;

    constructor(
        map: Spacemap,
        location: PortalLocations,
        destination: string
    ) {
        super(map.name, "Portal");
        this.location = location;
        this.destination = destination;
        this.mapSize = map.size;
        this.currentMap = map._config.name;
        this._type = "Portal";

        this.calculatePosition();
    }

    calculatePosition() {
        const maxX = this.mapSize.width / 2;
        const maxY = this.mapSize.height / 2;
        const borderOffset: number = 5;

        switch (this.location) {
            case "bottom":
                this.position = { x: 0, y: -maxY + borderOffset };
                break;
            case "bottom-left":
                this.position = {
                    x: -maxX + borderOffset,
                    y: -maxY + borderOffset,
                };
                break;
            case "bottom-right":
                this.position = {
                    x: maxX - borderOffset,
                    y: -maxY + borderOffset,
                };
                break;
            case "left":
                this.position = {
                    x: -maxX + borderOffset,
                    y: 0,
                };
                break;
            case "middle":
                this.position = {
                    x: 0,
                    y: 0,
                };
                break;
            case "right":
                this.position = {
                    x: maxX - borderOffset,
                    y: 0,
                };
                break;
            case "top":
                this.position = { x: 0, y: maxY - borderOffset };
                break;
            case "top-left":
                this.position = {
                    x: -maxX + borderOffset,
                    y: maxY - borderOffset,
                };
                break;
            case "top-right":
                this.position = {
                    x: maxX - borderOffset,
                    y: maxY - borderOffset,
                };
                break;
            default:
                console.error(
                    `WARNING! Portal class is not configured to handle portals at location: ${this.location}`
                );
                break;
        }
    }
}
