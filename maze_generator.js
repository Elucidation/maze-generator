// Functions to generate and visualize a 2D tiled maze


//////////////////////////////////////////////////////
// Maze / Tile Array
var N_rows = 15;
var N_cols = 21;
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

// Random
function generate_random_maze(inp_maze, wall_to_open_ratio = 0.5) {
  for (var row_idx = N_rows - 1; row_idx >= 0; row_idx--) {
    inp_maze[row_idx] = new Array(N_cols);
    for (var col_idx = N_cols - 1; col_idx >= 0; col_idx--) {
      inp_maze[row_idx][col_idx] = (Math.random() < wall_to_open_ratio) ? 1 : 0;
    }
  }
}

// Arbitrary fixed pattern
function generate_arbitrary_maze(inp_maze) {
  for (var row_idx = N_rows - 1; row_idx >= 0; row_idx--) {
    inp_maze[row_idx] = new Array(N_cols);
    for (var col_idx = N_cols - 1; col_idx >= 0; col_idx--) {
      inp_maze[row_idx][col_idx] = (((row_idx % 2) == 0) || ((col_idx % 4) == 0)) ? 1 : 0;
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// Start with all walls
// DFS via
// Choose random point, look for valid neighbors (is a wall, that has >=5 walls attached to it)
// Also resize every time a wall is knocked down
async function generate_maze1(inp_maze, mode = "BFS") {
  // First reset maze to all walls
  for (var i = inp_maze.length - 1; i >= 0; i--) {
    inp_maze[i].fill(WALL);
  }
  let visited = create_2d_array(N_rows, N_cols, 0);
  let rand_row = Math.floor(Math.random() * (N_rows-2))+1;
  let rand_col = Math.floor(Math.random() * (N_cols-2))+1;

  // Grow out
  let stack = [];
  // stack.push([1, 1]); // Always start from top left
  stack.push([rand_row, rand_col]);
  while (stack.length != 0) {
    let curr;
    // Dirty way to try 3 algorithms inside same function for simplicity.
    // TODO: Move this out.
    switch(mode) {
      case "BFS":
        curr = stack.shift(); // Normal BFS
        break;
      case "DFS":
        curr = stack.pop(); // Normal DFS
        break;
      case "rand":
        let ridx = Math.floor(Math.random()*stack.length);
        curr = stack.splice(ridx, 1)[0]; // pull out a random element in stack
        break;
      default:
      // Do nothing
    }
    visited[curr[0]][curr[1]] = 1; // Mark visited

    if (get8WallNeighborCount(curr, inp_maze) < 6) {
      // Skip this one as there aren't enough walls nearby.
      continue;
    }
    inp_maze[curr[0]][curr[1]] = OPEN; // Knock down wall in maze
    
    // Dirty way to slowly resize while generating.
    resize();
    await sleep(10);

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
    // Count out of bounds as walls
    // if (nr < 0 || nr >= inp_maze.length || nc < 0 || nc >= inp_maze[0].length || inp_maze[nr][nc] == WALL) {
    // Count out of bounds as open
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

// generate_random_maze(maze, 0.7);
// generate_arbitrary_maze(maze);

// Slowly draw a maze using BFS, then DFS, then random.
(async() => {
  console.log("BFS");
  await generate_maze1(maze, "BFS");
  await sleep(1000);
  
  console.log("DFS");
  await generate_maze1(maze, "DFS");
  await sleep(1000);

  console.log("rand");
  await generate_maze1(maze, "rand");
  await sleep(1000);
})();



window.addEventListener("resize", resize, {passive: true});
resize();




