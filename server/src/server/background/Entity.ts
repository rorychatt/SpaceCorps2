export class Entity {
    name: string;
    currentMap: string;
    position: { x: number; y: number };

    public constructor(name: string, position?: { x: number; y: number }) {
        this.name = name;
        this.currentMap = "M-1";
        if (position) {
            this.position = position;
        } else {
            this.position = { x: 0, y: 0 };
        }
    }
}
