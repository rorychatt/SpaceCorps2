type input_data = {
    name: string;
    entities: any[];
    projectiles: any[];
    cargoboxes: any[];
    oreSpawnDTO: any[];
    size: { width: number; height: number };
};

type Vector2D = { x: number; y: number };
type Vector3D = { x: number; y: number; z: number };

let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D | null;
let playerName: string | undefined;

onmessage = function (e) {
    if (e.data && e.data.type) {
        switch (e.data.type) {
            case "setPlayerName":
                playerName = e.data.playerName;
                console.log(`Worker: Received playerName - ${playerName}`);
                break;
            case "update":
                drawMinimap(e.data.data);
                break;
            default:
                console.error("Worker: Unknown message type received");
        }
    } else {
        if (e.data && e.data.canvas) {
            canvas = e.data.canvas;
            ctx = canvas.getContext("2d");
        }
        console.error("Worker: Message received without type", e);
    }
};

function drawMinimap(inputData: input_data) {
    if (!ctx) return;
    const { width, height } = inputData.size;

    ctx.clearRect(0, 0, width, height);

    canvas.width = width;
    canvas.height = height;

    // Draw a border around the canvas
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    inputData.entities.forEach((entity) => {
        drawDot(entity.position, "red");
    });

    inputData.cargoboxes.forEach((box) => {
        drawDot(box.position, "white");
    });

    inputData.oreSpawnDTO.forEach((ore) => {
        drawDot(ore.position, "grey");
    });

    if (inputData.entities.length > 0) {
        for (const entity in inputData.entities) {
            if (inputData.entities[entity].name == playerName) {
                drawCross(inputData.entities[entity].position);
                drawText(
                    `${Math.round(
                        inputData.entities[entity].position.x
                    )}, ${Math.round(inputData.entities[entity].position.y)}`,
                    { x: 40, y: 20 }
                );
                break;
            }
        }
    }

    drawText(inputData.name, { x: 10, y: 20 });
}

function transformCoordinates(position: Vector2D): Vector2D {
    return {
      x: canvas.width / 2 + position.x,
      y: canvas.height / 2 + position.y,
    };
  }

function drawDot(
    position: Vector2D,
    color: string | CanvasGradient | CanvasPattern
) {
    if (!ctx) return;
    position = transformCoordinates(position)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(position.x, position.y, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawCross(position: Vector2D) {
    if (!ctx) return;
    position = transformCoordinates(position)
    ctx.strokeStyle = "lime";
    ctx.beginPath();
    ctx.moveTo(position.x - 5, position.y);
    ctx.lineTo(position.x + 5, position.y);
    ctx.moveTo(position.x, position.y - 5);
    ctx.lineTo(position.x, position.y + 5);
    ctx.stroke();
}

function drawText(text: string, startPos: Vector2D) {
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(text, startPos.x, startPos.y);
}
