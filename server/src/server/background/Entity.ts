import { randomBytes } from "crypto";
import {
    StaticEntityLocations,
    Spacemap,
    SpacemapSize,
    Vector2D,
} from "./Spacemap";
export class SafeZone {
    position: Vector2D;
    radius: number;

    constructor(position: Vector2D, radius: number) {
        this.position = position;
        this.radius = radius;
    }

    isInSafeZone(position: Vector2D): boolean {
        //TODO: dont forget about radii
        if (
            (position.x - this.position.x) ** 2 +
            (position.y - this.position.y) ** 2
        ) {
            return true;
        } else {
            return false;
        }
    }
}
export class Entity {
    readonly name: string;
    position: Vector2D;
    currentMap: string;
    readonly uuid = randomBytes(16).toString("hex");

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
    location: StaticEntityLocations;
    destination: string;
    safeZoneRadii: number;
    readonly _type: string = "Portal";

    constructor(
        map: Spacemap,
        location: StaticEntityLocations,
        destination: string,
        safeZoneRadii: number
    ) {
        super(map.name, "Portal");
        this.location = location;
        this.destination = destination;
        this.currentMap = map._config.name;
        this.safeZoneRadii = safeZoneRadii;

        this.position = calculateEntityPosition(location, map.size);
    }
}

export class CompanyBase extends Entity {
    location: StaticEntityLocations;
    safeZoneRadii: number;
    readonly _type: string = "CompanyBase";

    constructor(
        map: Spacemap,
        location: StaticEntityLocations,
        name: string,
        safeZoneRadii: number
    ) {
        super(name, "CompanyBase");
        this.location = location;
        this.position = calculateEntityPosition(location, map.size);
        this.safeZoneRadii = safeZoneRadii;
    }
}

export function calculateEntityPosition(
    location: StaticEntityLocations,
    mapSize: SpacemapSize
): Vector2D {
    const maxX = mapSize.width / 2;
    const maxY = mapSize.height / 2;
    const borderOffset: number = 5;
    let position: Vector2D;

    switch (location) {
        case "bottom":
            position = { x: 0, y: -maxY + borderOffset };
            break;
        case "bottom-left":
            position = { x: -maxX + borderOffset, y: -maxY + borderOffset };
            break;
        case "bottom-right":
            position = { x: maxX - borderOffset, y: -maxY + borderOffset };
            break;
        case "left":
            position = { x: -maxX + borderOffset, y: 0 };
            break;
        case "middle":
            position = { x: 0, y: 0 };
            break;
        case "right":
            position = { x: maxX - borderOffset, y: 0 };
            break;
        case "top":
            position = { x: 0, y: maxY - borderOffset };
            break;
        case "top-left":
            position = { x: -maxX + borderOffset, y: maxY - borderOffset };
            break;
        case "top-right":
            position = { x: maxX - borderOffset, y: maxY - borderOffset };
            break;
        default:
            console.error(`WARNING! Unknown location: ${location}`);
            position = { x: 0, y: 0 };
    }

    return position;
}
