"""
Generate PWA icons for Cosmos Workbench
Creates 192x192 and 512x512 PNG icons with the app's vibrant purple theme
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background: vibrant gradient-like circle (deep purple to indigo)
    # Outer circle - dark purple
    margin = int(size * 0.05)
    radius = (size // 2) - margin
    cx, cy = size // 2, size // 2

    # Draw filled rounded rectangle background (dark purple gradient effect)
    bg_color1 = (26, 15, 61)  # #1A0F3D
    bg_color2 = (45, 27, 105) # #2D1B69

    # Draw rounded rectangle as background
    r = int(size * 0.22)  # corner radius
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=r,
        fill=bg_color1
    )

    # Draw inner shape - planet/cosmos theme
    # Outer ring (lighter purple)
    ring_outer = radius - int(size * 0.08)
    ring_inner = radius - int(size * 0.12)

    # Draw the planet circle (gradient effect with concentric circles)
    planet_radius = int(size * 0.22)
    # Planet: vibrant indigo/purple
    for i in range(planet_radius, 0, -1):
        ratio = i / planet_radius
        r_val = int(108 * ratio + 45 * (1 - ratio))
        g_val = int(92 * ratio + 27 * (1 - ratio))
        b_val = int(231 * ratio + 105 * (1 - ratio))
        draw.ellipse(
            [cx - i, cy - i, cx + i, cy + i],
            fill=(r_val, g_val, b_val, 255)
        )

    # Add orbit ring (teal accent)
    orbit_color = (0, 210, 211, 200)  # #00D2D3
    orbit_w = max(2, int(size * 0.015))
    draw.ellipse(
        [cx - radius + int(size * 0.02), cy - int(size * 0.28),
         cx + radius - int(size * 0.02), cy + int(size * 0.28)],
        outline=orbit_color,
        width=orbit_w
    )

    # Add small star/sparkle accents
    star_color = (255, 255, 255, 220)
    stars = [
        (int(size * 0.25), int(size * 0.25), int(size * 0.03)),
        (int(size * 0.75), int(size * 0.30), int(size * 0.025)),
        (int(size * 0.20), int(size * 0.70), int(size * 0.02)),
        (int(size * 0.80), int(size * 0.75), int(size * 0.028)),
    ]
    for sx, sy, sr in stars:
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=star_color)

    # Save
    img.save(filename, 'PNG')
    print(f"Generated: {filename} ({size}x{size})")

def main():
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    create_icon(192, os.path.join(icons_dir, 'icon-192.png'))
    create_icon(512, os.path.join(icons_dir, 'icon-512.png'))

    print("All icons generated successfully!")

if __name__ == '__main__':
    main()
