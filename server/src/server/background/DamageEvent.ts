export class DamageEvent {
    defenderUUID: string;
    attackerUUID?: string;
    damage?: number;

    constructor(defenderUUID: string, attackerUUID?: string, damage?: number) {
        this.defenderUUID = defenderUUID;
        if (attackerUUID) {
            this.attackerUUID = attackerUUID;
        }
        if (damage) {
            this.damage = damage;
        }
    }
}
