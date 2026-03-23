// profileColor.js - Shared profile color management

/**
 * Generate a deterministic color from a wallet address
 * @param {string} address - Wallet address
 * @returns {string} - CSS color value
 */
export function getProfileColor(address) {
  if (!address) return "#6B7280"; // Default gray for no wallet

  // Method 1: Simple hash-based color (pastel colors)
  const hash = address.slice(2, 10); // Use part of address after 0x
  const hue = parseInt(hash, 16) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Alternative: Predefined color palette based on address
 */
export function getProfileColorFromPalette(address) {
  if (!address) return "#6B7280";

  // Predefined beautiful colors
  const palette = [
    "#FF6B6B", // Coral Red
    "#4ECDC4", // Turquoise
    "#45B7D1", // Sky Blue
    "#96CEB4", // Mint Green
    "#FFEAA7", // Light Yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Seafoam
    "#F7B05E", // Orange
    "#C7B9FF", // Lavender
    "#FF9999", // Pink
  ];

  // Use address to pick consistent color
  const index = parseInt(address.slice(2, 10), 16) % palette.length;
  return palette[index];
}

/**
 * Generate gradient background
 */
export function getProfileGradient(address) {
  if (!address) return "linear-gradient(135deg, #6B7280, #4B5563)";

  const hash1 = parseInt(address.slice(2, 10), 16) % 360;
  const hash2 = parseInt(address.slice(10, 18), 16) % 360;

  return `linear-gradient(135deg, hsl(${hash1}, 70%, 60%), hsl(${hash2}, 70%, 55%))`;
}

/**
 * Get initials from wallet address
 * @param {string} address - Wallet address
 * @returns {string} - First 2-3 characters or custom initials
 */
export function getProfileInitials(address) {
  if (!address) return "👤";

  // Option 1: Show first 2 chars after 0x
  //   const firstTwo = address.slice(2, 4).toUpperCase();
  //   return firstTwo;

  // Option 2: Show last 2 chars
  // return address.slice(-2).toUpperCase();

  // Option 3: Show emoji based on address
  const emojis = ["🐱", "🐶", "🦊", "🐼", "🐨", "🐸", "🐙", "🦄"];
  const index = parseInt(address.slice(2, 6), 16) % emojis.length;
  return emojis[index];
}

/**
 * Apply profile styling to an element
 * @param {HTMLElement} element - The profile circle element
 * @param {string} address - Wallet address
 * @param {boolean} showInitials - Whether to show initials inside
 */
export function applyProfileStyle(element, address, showInitials = true) {
  if (!element) return;

  // Apply consistent styling
  element.style.width = "30px";
  element.style.height = "30px";
  element.style.borderRadius = "50%";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.cursor = "pointer";
  element.style.transition = "transform 0.2s";

  // Apply color based on address
  const backgroundColor = getProfileColor(address);
  element.style.background = backgroundColor;

  // Add hover effect
  element.addEventListener("mouseenter", () => {
    element.style.transform = "scale(1.05)";
  });
  element.addEventListener("mouseleave", () => {
    element.style.transform = "scale(1)";
  });

  // Show initials if requested
  if (showInitials && address) {
    element.style.color = "white";
    element.style.fontSize = "14px";
    element.style.fontWeight = "bold";
    element.style.textShadow = "0 1px 2px rgba(0,0,0,0.2)";
    element.textContent = getProfileInitials(address);
  }

  // Optional: Add tooltip with full address
  element.title = address
    ? `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}`
    : "No wallet";
}
