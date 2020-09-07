// Functions to generate and visualize a 2D tiled maze


//////////////////////////////////////////////////////
// Maze / Tile Array
var N_rows = 35;
var N_cols = 51;
var WALL = 1;
var OPEN = 0;

function create_2d_array(num_rows, num_cols, fill_val = 0) {
  let arr = new Array(num_rows);
  for (var row_idx = num_rows - 1; row_idx >= 0; row_idx--) {
    arr[row_idx] = new Array(num_cols).fill(fill_val);
  }
  return arr;
}

var maze = create_2d_array(N_rows, N_cols, WALL);

// Hacky way to visualize maze generation in realtime by sleeping between redraws.
function sleep_ms(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// Start with all walls
// some type of DFS/BFS/RandomDFS via:
// Choose random point, look for valid neighbors (is a wall, that has >=5 walls attached to it)
// Also redraw every time a wall is knocked down and delay graphics to show growing
async function generate_maze(inp_maze) {
  // First reset maze to all walls
  for (var i = inp_maze.length - 1; i >= 0; i--) {
    inp_maze[i].fill(WALL);
  }
  let visited = create_2d_array(N_rows, N_cols, 0);
  // Random starting point
  // let rand_row = Math.floor(Math.random() * (N_rows-2))+1;
  // let rand_col = Math.floor(Math.random() * (N_cols-2))+1;
  // Start in top left corner
  rand_row = 1;
  rand_col = 1;

  // Grow out
  let stack = [];
  stack.push([rand_row, rand_col]);
  while (stack.length != 0) {
    let curr;
    // curr = stack.shift(); // Normal BFS
    // curr = stack.pop(); // Normal DFS
    let ridx = Math.floor(Math.random()*stack.length);
    curr = stack.splice(ridx, 1)[0]; // Pull out a random element in stack

    visited[curr[0]][curr[1]] = 1; // Mark visited

    if (get8WallNeighborCount(curr, inp_maze) < 6) {
      // Skip this one as there aren't enough walls nearby.
      continue;
    }
    inp_maze[curr[0]][curr[1]] = OPEN; // Knock down wall in maze
    
    // Dirty way to slowly resize while generating.
    resize();
    await sleep_ms(10);

    let neighbors = get4Neighbors(curr, inp_maze, visited);
    for (neighbor_idx in neighbors) {
      let neighbor = neighbors[neighbor_idx];
      stack.push(neighbor);
    }
  }
}

function get4Neighbors(curr, inp_maze, visited) {
  let offsets = [[-1,0],
                 [0,-1],
                 [1,0],
                 [0,1],
                 ];
  let neighbors = [];
  for (offset_idx in offsets) {
    let offset = offsets[offset_idx];
    let nr = curr[0] + offset[0];
    let nc = curr[1] + offset[1];
    // Look for valid neighbors
    if (nr >= 0 && nr < inp_maze.length && nc >= 0 && nc < inp_maze[0].length // Is not out of bounds
        && inp_maze[nr][nc] == WALL // is a wall that can be knocked down
        && visited[nr][nc] == 0 // not visited yet
        && get8WallNeighborCount([nr, nc], inp_maze) >= 6 // neighbors has enough walls to knock down
        ) {
      neighbors.push([nr, nc]);
    }
  }
  return neighbors;
}

// TODO: Change to count 4 neighbors and 8 neighbors separately.
// This will allow us to avoid creating incorrect diagonal joints.
function get8WallNeighborCount(pos, inp_maze) {
  let offsets = [[-1,0],
                 [-1,-1],
                 [0,-1],
                 [1,-1],
                 [1,0],
                 [1,1],
                 [0,1],
                 [-1,1],
                 ];
  let wall_count = 0;
  for (offset_idx in offsets) {
    let offset = offsets[offset_idx];
    let nr = pos[0] + offset[0];
    let nc = pos[1] + offset[1];
    // Don't count out of bounds as walls
    if ((nr >= 0 && nr < inp_maze.length && nc >= 0 && nc < inp_maze[0].length)
        && inp_maze[nr][nc] == WALL) {
      wall_count++;
    }
  }
  return wall_count;
}

//////////////////////////////////////////////////////
// Graphics
var buffer = document.createElement("canvas").getContext("2d");
var context = document.querySelector("canvas").getContext("2d");
size = 32; // px per cell
buffer.canvas.height = N_rows * size;
buffer.canvas.width = N_cols * size;
WALL_COLOR = "#000000";
OPEN_COLOR = "#ffffff";

function drawMaze() {
  for (var row_idx = N_rows - 1; row_idx >= 0; row_idx--) {
    for (var col_idx = N_cols - 1; col_idx >= 0; col_idx--) {
      let cell = maze[row_idx][col_idx];
      buffer.fillStyle = (cell == 1) ? WALL_COLOR : OPEN_COLOR;
      buffer.fillRect(col_idx * size, row_idx * size, size, size);
    }
  }
  context.drawImage(buffer.canvas, 0, 0, buffer.canvas.width, buffer.canvas.height, 
                                   0, 0, context.canvas.width, context.canvas.height);
};


// Resize tile map to fit nicely in the screen, then redraw the maze
function resize(event) {
  let min_span = (document.documentElement.clientWidth < document.documentElement.clientHeight) ?
                  document.documentElement.clientWidth : document.documentElement.clientHeight;
  let cell_px_ratio = Math.floor((min_span - size) / N_cols);
  context.canvas.width = cell_px_ratio*N_cols;
  context.canvas.height = cell_px_ratio*N_rows;
  drawMaze();
}


//////////////////////////////////////////////////////
// Main
window.addEventListener("resize", resize, {passive: true});
resize();

// Slowly draw random maze
(async() => {
  await generate_maze(maze);
})();





