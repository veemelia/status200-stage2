// Load modules
const readline = require("./readlineInstance"); // Import readline instance for index.js and game.js to share (reduces redundancy of createInterface)

// Global variables
let attempts = 0; // Number of attempts
let attemptsPerGame = []; // Number of attempts per game
let randNum; // Randomised number for game
let min = 1; // Minimum guess value
let max = 100; // Maximum guess value
let prevGuess; // Store value of user's previous guess
// Colors for terminal
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  black: "\x1b[30m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

// Prints welcome message
function welcomeMsg() {
  console.log(
    `${colors.cyan}\n✧･ﾟ: *✧･ﾟ:*                                         *:･ﾟ✧*:･ﾟ✧
             WELCOME TO THE NUMBER GUESSING GAME!
                              ~~                               
          Win by guessing a number between 1 and 100
*+:｡.｡                                                  ｡.｡:+*\n${colors.reset}`
  );
}

// Generates random numbers, inclusive of min and max
function randNumGenerator() {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get user's guess
function getGuess(callback) {
  // console.log(`Correct answer: ${randNum}`); // Testing purposes
  readline.question("Guess my number! (1-100): ", function (input) {
    let guess = parseInt(input); // User's guess

    // If guess is invalid
    if (isNaN(guess) || guess < min || guess > max) {
      console.error("Invalid input. Guess a number between 1 and 100.\n");
      getGuess(callback);

      // If guess is valid
    } else {
      attempts++; // Start attempts counter

      // If guess is correct
      if (guess === randNum) {
        console.log(
          `${colors.green}You guessed correctly! (=^･ｪ･^=))ﾉ彡☆\nAttempts: ${attempts}\n${colors.reset}`
        );
        attemptsPerGame.push(attempts); // Add number of attempts to list of games
        attempts = 0; // Reset attempts for new game
        replayOrExit(callback);

        // If guess is incorrect
      } else {
        var hint = "";

        // If there is a previous guess
        if (prevGuess !== undefined) {
          let prevDist = Math.abs(prevGuess - randNum); // Previous distance between guess and randNum
          let currDist = Math.abs(guess - randNum); // Current distance between guess and randNum

          // Provide the user a hint
          if (currDist < prevDist) {
            hint = `${colors.green}\nBut you're getting hotter! ʕ♥ᴥ♥ʔ${colors.reset}`;
          } else if (currDist > prevDist) {
            hint = `${colors.yellow}\nAnd you just got colder... (╯°□°)╯︵ ┻━┻${colors.reset}`;
          } else {
            hint = `${colors.yellow}\nThat's the same distance as before. ಠ_ಠ${colors.reset}`;
          }
        }

        // Update previous guess
        prevGuess = guess;

        // If guess is too low
        if (guess < randNum) {
          console.log(
            `${colors.magenta}Nope! You guessed too low! ☹${hint}\n${colors.reset}`
          );

          // If guess is too high
        } else {
          console.log(
            `${colors.magenta}Nope! You guessed too high! ☹${hint}\n${colors.reset}`
          );
        }

        // Try guessing again
        getGuess(callback);
      }
    }
  });
}

// Prompts the user to decide to replay or exit
function replayOrExit(callback) {
  readline.question("Play again? (Yes or No): ", function (input) {
    // If user wants to replay
    if (input.toLowerCase() === "yes") {
      console.log(`${colors.yellow}You've chosen to replay.\n${colors.reset}`); // Selection notification
      randNum = randNumGenerator();
      // console.log(randNum); // Testing purposes
      getGuess(callback);

      // If user wants to exit
    } else if (input.toLowerCase() === "no") {
      console.log(`${colors.yellow}You've chosen to exit.\n${colors.reset}`); // Selection notification
      calcAveAttempts(callback); // Calculate average attempts

      // If input invalid
    } else {
      console.error("Invalid input. Enter Yes or No only.\n");
      replayOrExit(callback);
    }
  });
}

// Calculates average attempts
function calcAveAttempts(callback) {
  if (attemptsPerGame.length !== 0) {
    // Calculate sum of attempts for all games
    let averagePerSession =
      attemptsPerGame.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }) / attemptsPerGame.length;

    // Print statistics
    console.log(
      `${colors.green}Total games played: ${
        attemptsPerGame.length
      }\nAverage attempt per game: ${averagePerSession.toFixed(2)}.${
        colors.reset
      }`
    );

    // Goodbye message
    console.log(
      `${colors.cyan}\n✧･ﾟ: *✧･ﾟ:*  THANKS FOR PLAYIING!  *:･ﾟ✧*:･ﾟ✧\n${colors.reset}`
    );

    callback(attemptsPerGame, averagePerSession); // Exports statistics
  }
}

// Initialises the game
function startGame(callback) {
  welcomeMsg();
  randNum = randNumGenerator();
  // console.log(randNum); // Testing purposes
  getGuess(callback);
}

// Export function
module.exports = startGame;

// Run the game
if (require.main === module) {
  // Ensure main only runs when script is executed directly
  startGame();
}
