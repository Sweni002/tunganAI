const { createCanvas } = require("canvas");
const fs = require("fs");

const width = 1080;
const height = 1920;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// fond
ctx.fillStyle = "#0f172a";
ctx.fillRect(0, 0, width, height);

// texte
ctx.fillStyle = "#ffffff";
ctx.font = "bold 80px Arial";
ctx.fillText("FaceGov App", 200, 300);

ctx.font = "50px Arial";
ctx.fillText("Version mobile PWA", 200, 450);

// bouton fake UI
ctx.fillStyle = "#22c55e";
ctx.fillRect(200, 700, 680, 120);

ctx.fillStyle = "#000";
ctx.font = "60px Arial";
ctx.fillText("Se connecter", 350, 780);

const buffer = canvas.toBuffer("image/png");
fs.writeFileSync("public/screenshot-mobile.png", buffer);

console.log("screenshot-mobile.png généré !");
