

self.addEventListener("message", (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case "updateObjects":
            const updatedEntities = updateEntities(payload);
            self.postMessage({
                type: "updatedEntities",
                payload: updatedEntities,
            });
            break;

        default:
            console.warn(`Unknown message type received: ${type}`);
    }
});

function updateEntities(entities: any[]): any[] {
    // Perform data processing and calculations here
    const updatedEntities = entities.map((entity) => {
        const { position, targetUUID, name, hitPoints, _type, activeShipName } =
            entity;
        const { x: posX, y: posY } = position;

        const targetDirection = { x: posX, y: 0, z: posY };
        const distanceSquared =
            (posX - entity.position.x) ** 2 + (posY - entity.position.z) ** 2;


        return {
            ...entity,
            targetDirection,
            distanceSquared,
            // ... other updated fields ...
        };
    });

    return updatedEntities;
}
