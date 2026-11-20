# 3D Ocean Cleanup Boat

A browser-based 3D ocean cleanup game built with HTML, CSS, and vanilla JavaScript. Pilot a cleanup boat, skim floating trash, and avoid oil spills and sea turtles before the 60-second patrol ends.
[!Watch the Demo](https://www.youtube.com/watch?v=AEF3YOOhDbc)
## Gameplay

- Drive the boat around the ocean to collect floating trash.
- Each piece of collected trash increases your score.
- Avoid dark oil spills, which slow the boat down.
- Avoid sea turtles, which reverse the boat and subtract 2 points.
- Complete the patrol before the 60-second timer reaches zero.

The ocean gradually becomes clearer as your score increases.

## Controls

| Action | Keys |
| --- | --- |
| Accelerate / move forward | `W` or `Arrow Up` |
| Reverse / move backward | `S` or `Arrow Down` |
| Turn left | `A` or `Arrow Left` |
| Turn right | `D` or `Arrow Right` |

Use the **Sail Again** button after a patrol to reset the game.

## Run the Game

This project has no dependencies or build step.

### Option 1: Open directly

Open `index.html` in a modern web browser.

### Option 2: Use a local server

From the project directory, run:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Project Files

- `index.html` - Page layout, UI, styles, and canvas
- `game.js` - Game loop, controls, collision logic, 3D projection, and rendering
