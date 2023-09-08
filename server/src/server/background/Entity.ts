export class Entity {
    name: string;
    currentMap: string;
    position: { x: number; y: number };

    public constructor(name: string) {
        this.name = name;
        this.currentMap = "M-1";
        this.position = { x: 0, y: 0 };
    }
}
