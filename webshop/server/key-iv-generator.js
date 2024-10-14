// THIS FILE IS ONLY USED TO GENERATE KEY AND IV FOR .ENV

import crypto from "crypto";

// Generate a 256-bit (32-byte) AES key
const key = crypto.randomBytes(32);
console.log("Base64 Encoded Key:", key.toString("base64"));

// Generate a random IV for AES-GCM (12 bytes for AES-GCM)
function generateIV() {
  return crypto.randomBytes(12);
}

// Convert IV to base64 for storage or transmission
function ivToBase64(iv) {
  return iv.toString("base64");
}

// Example usage
const iv = generateIV();
console.log("Generated IV (Base64):", ivToBase64(iv));
