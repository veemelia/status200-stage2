// Load modules
const readline = require("./readlineInstance"); // Import readline instance for index.js and game.js to share (reduces redundancy of createInterface)
const mysql = require("mysql2");
const startGame = require("./game.js");

// Global variables for login purposes
let username;
let password;
let nickname;
let game_start; // Game start time
let game_end; // Game end time

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

// Create a connection to the database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "guessing_game_db",
});

// Connect to database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: ", err.stack);
    process.exit(1); // Terminate Node processes with error
  }
  // Connection successful
  // console.log("Connected to the database as id" + connection.threadId);
});

// Loads starting page
function loadStartingPage() {
  console.log(`${colors.bgBlue}${colors.white}========================================
                                        
           NUMBER GUESSING GAME         
                                        
           1: Register                  
           2: Login                     
           X: Exit                      
                                        
========================================${colors.reset}`);

  // Get user input
  readline.question("Choose your action: ", (choice) => {
    switch (choice.toLowerCase()) {
      // Get username to begin registration process
      case "1":
        console.log(
          `${colors.yellow}You selected: Register${colors.reset}\n\n`
        );
        getUsername();
        break;

      // Get login details to begin login process
      case "2":
        console.log(`${colors.yellow}You selected: Login${colors.reset}\n\n`);
        getLoginDetails();
        break;

      // Exit and end script
      case "x":
        console.log(`${colors.yellow}You selected: Exit${colors.reset}\n\n`);
        exit();
        break;

      // Invalid input
      default:
        console.error("Invalid input. Re-enter selection.\n\n");
        loadStartingPage();
    }
  });
}

// Gets username for registration
function getUsername() {
  console.log(`${colors.bgYellow}${colors.black}========================================
                                        
         ACCOUNT REGISTRATION           
                                        
========================================${colors.reset}`);

  // Get user input
  readline.question(
    "Enter a username (case insensitive, 3-50 characters): ",
    (input) => {
      // If username length is invalid
      if (input.trim() === "" || input.length < 3 || input.length > 50) {
        console.error("Username must be 3 to 50 characters.\n");
        return getUsername();
      }

      // Prepare SQL to retrieve unique usernames from Players table
      let sql_unique_usernames = `
        SELECT *
        FROM Players
        WHERE username = ?`;

      // Query database
      connection.query(
        sql_unique_usernames,
        [input.toLowerCase()],
        (err, results) => {
          // If error checking username
          if (err) {
            console.error("Error checking username: ", err.stack);
            return loadStartingPage();
          }

          // If username is not unique, get username again
          if (results.length > 0) {
            console.error("Username is already taken.\n");
            return getUsername();
          }

          // Username entered is unique
          username = input.toLowerCase(); // Update global variable
          getPassword(); // Get password for registration
        }
      );
    }
  );
}

// Gets password for registration
function getPassword() {
  // Get user input
  readline.question("Enter a password (8-20 characters): ", (input) => {
    // If password length is invalid
    if (input.trim() === "" || input.length < 8 || input.length > 20) {
      console.error("Password must be 8 to 20 characters.\n");
      return getPassword();
    }

    // Password entered is valid
    password = input; // Update global variable
    getNickname(); // Get nickname for registration
  });
}

// Gets nickname for registration
function getNickname() {
  // Get user input
  readline.question("Enter a nickname (3-50 characters): ", (input) => {
    // If nickname length is invalid
    if (input.trim() === "" || input.length < 3 || input.length > 50) {
      console.error("Nickname must be 3 to 50 characters.\n");
      return getNickname();
    }

    // Nickname is valid
    nickname = input; // Update global variable
    register(); // Register new player
  });
}

// Registers a new player
function register() {
  // Prepare SQL to insert new player
  let sql_new_player = `
    INSERT INTO Players (username, nickname, password)
    VALUES
      (?, ?, ?)`;

  // Query database
  connection.query(
    sql_new_player,
    [username, nickname, password],
    (err, results) => {
      // If error inserting new player
      if (err) {
        console.error("Error inserting new player: ", err.stack);
        return loadStartingPage();
      }

      // Insert is successful
      console.log(`${colors.green}New player added!${colors.reset}\n\n`);
      showTopScorers(); // Show top scorers
    }
  );
}

// Gets login details
function getLoginDetails() {
  console.log(`${colors.bgYellow}${colors.black}========================================
                                        
                 LOGIN                  
                                        
========================================${colors.reset}`);

  // Get user input
  readline.question("Enter your username: ", (login_username) => {
    if (login_username.trim() !== "" && login_username.length > 0) {
      readline.question("Enter your password: ", (login_password) => {
        if (login_username.trim() !== "" && login_password.length > 0) {
          // Prepare SQL to check username
          let sql_check_username = `
            SELECT *
            FROM Players
            WHERE username = ?`;

          // Query database
          connection.query(
            sql_check_username,
            [login_username.toLowerCase()],
            (err, players) => {
              // If error checking username
              if (err) {
                console.error("Error checking username: ", err.stack);
                return loadStartingPage();
              }

              // If user does not exist
              if (players.length === 0) {
                console.error("User does not exist.\n\n");
                return loadStartingPage();
              }

              // If entered password matches password in database, according to entered username (Successful login)
              if (players[0].password === login_password) {
                console.log(
                  `${colors.green}Login successful!${colors.reset}\n\n`
                );

                // Record player details to global variables
                players.forEach((player) => {
                  username = player.username;
                  password = player.password;
                  nickname = player.nickname;
                });

                showTopScorers(); // Show top scorers

                // If entered password does not match password in database, according to entered username
              } else {
                console.error("Incorrect username or password\n\n");
                return getLoginDetails();
              }
            }
          );
        } else {
          // Invalid input
          console.error("Invalid input. Re-enter username and password.\n\n");
          return getLoginDetails();
        }
      });
    } else {
      // Invalid input
      console.error("Invalid input. Re-enter username.\n\n");
      return getLoginDetails();
    }
  });
}

// Finds top scorers
function showTopScorers() {
  console.log(`${colors.bgCyan}${colors.black}========================================
                                        
          WELCOME, ${nickname}!         
                                        
========================================${colors.reset}`);

  // Prepare SQL to find lowest attempt in a game for whole database
  let sql_lowest_attempt = `
    SELECT MIN(attempts_per_game) AS min_attempts
    FROM SessionDetails`;

  // Query database
  connection.query(sql_lowest_attempt, (err, results) => {
    // If error executing query
    if (err) {
      console.error("Error executing query: ", err);
      return loadMainMenu();
    }

    // If no data found
    if (results.length === 0) {
      console.error("No data found.\n\n");
      return loadMainMenu();
    }

    // Store lowest attempt in a game for whole database
    let min_attempts = results[0].min_attempts;

    // Prepare SQL to find player(s) with the lowest attempt in a game for whole database
    let sql_players_lowest_attempt = `
        SELECT DISTINCT p.username AS Username, p.nickname AS Nickname, sd.attempts_per_game AS Attempts
        FROM SessionDetails AS sd
          JOIN Sessions AS s ON sd.session_id = s.session_id
          JOIN Players AS p ON s.player_id = p.player_id
        WHERE sd.attempts_per_game = ?`;

    // Query database
    connection.query(
      sql_players_lowest_attempt,
      [min_attempts],
      (err, players) => {
        // If error executing query
        if (err) {
          console.error("Error executing query: ", err.stack);
          return loadMainMenu();
        }

        if (players.length === 0) {
          console.error("No data found.\n\n");
          return loadMainMenu();
        }

        // Show player(s) with the lowest attempt in a game for whole database
        console.log(
          `${colors.magenta}Players with the lowest attempt in a game ever:${colors.reset}`
        );
        players.forEach((player) => {
          console.log(
            `${colors.green}${player.Nickname} (${player.Username}) with ${player.Attempts} attempts.${colors.reset}`
          );
        });
        console.log("");
      }
    );

    // Prepare SQL to find player(s) with the lowest average attempt per session of games
    let sql_players_best_ave_session = `
    SELECT DISTINCT p.username AS Username, p.nickname AS Nickname, sd.average_attempt as Attempts
    FROM Players AS p
      JOIN Sessions AS s ON p.player_id = s.player_id
      JOIN SessionDetails AS sd ON s.session_id = sd.session_id
    WHERE sd.average_attempt = (
        SELECT MIN(average_attempt)
        FROM SessionDetails
    )`;

    // Query database
    connection.query(sql_players_best_ave_session, (err, players) => {
      // If error executing query
      if (err) {
        console.error("Error executing query: ", err);
        return loadMainMenu();
      }

      // If no data found
      if (players.length === 0) {
        console.error("No data found.\n\n");
        return loadMainMenu();
      }

      // Show player(s) with the lowest average attempt per session of games
      console.log(
        `${colors.magenta}Players with the best average attempt in a single session:${colors.reset}`
      );
      players.forEach((player) => {
        console.log(
          `${colors.green}${player.Nickname} (${player.Username}) with ${player.Attempts} attempts.${colors.reset}`
        );
      });
      console.log("");
    });

    // Prepare SQL to find 1 player with the lowest average attempt in whole database
    let sql_player_best_ave_alltime = `
      SELECT p.username AS Username, p.nickname AS Nickname, ROUND(AVG(sd.attempts_per_game), 2) AS Attempts
        FROM Players AS p
          JOIN Sessions AS s ON p.player_id = s.player_id
          JOIN SessionDetails AS sd ON s.session_id = sd.session_id
      GROUP BY p.username
      ORDER BY Attempts
      LIMIT 1`;

    // Query database
    connection.query(sql_player_best_ave_alltime, (err, players) => {
      // If error executing query
      if (err) {
        console.error("Error executing query: ", err);
        return loadMainMenu();
      }

      // If no data found
      if (players.length === 0) {
        console.error("No data found.\n\n");
        return loadMainMenu();
      }

      // Show player with the lowest average attempt in whole database
      console.log(
        `${colors.magenta}Players with the best average attempt of all time:${colors.reset}`
      );
      players.forEach((player) => {
        console.log(
          `${colors.green}${player.Nickname} (${player.Username}) with ${player.Attempts} attempts.${colors.reset}`
        );
      });
      console.log("\n");

      loadMainMenu(); // Go to Main Menu
    });
  });
}

// Loads Main Menu page (post-login)
function loadMainMenu() {
  console.log(`${colors.bgBlue}${colors.white}========================================
                                        
              MAIN MENU                 
                                        
      1: See game history               
      2: Start new game                 
      U: Update account data            
      D: Delete account                 
      X: Log out to Starting Page       
                                        
========================================${colors.reset}`);

  // Get user input
  readline.question("Enter your choice: ", (choice) => {
    switch (choice.toLowerCase()) {
      // Show game log
      case "1":
        console.log(
          `${colors.yellow}You selected: See game history${colors.reset}\n\n`
        );
        seeGameLog();
        break;

      // Start new game
      case "2":
        console.log(
          `${colors.yellow}You selected: Start new game${colors.reset}\n\n`
        );
        startNewGame();
        break;

      // Update user account
      case "u":
        console.log(
          `${colors.yellow}You selected: Update account data${colors.reset}\n\n`
        );
        updateAcct();
        break;

      // Delete user account
      case "d":
        console.log(
          `${colors.yellow}You selected: Delete account${colors.reset}\n\n`
        );
        loadDeleteAcctPage();
        break;

      // Log out to Starting Page
      case "x":
        console.log(
          `${colors.yellow}You selected: Log out to Starting Page${colors.reset}\n\n`
        );

        // Reset variables
        username = undefined;
        password = undefined;
        nickname = undefined;

        loadStartingPage();
        break;

      // Invalid input
      default:
        console.error("Invalid input. Re-enter selection.\n\n");
        loadMainMenu();
    }
  });
}

// See user's personal game log
function seeGameLog() {
  // Prepare SQL to find user's personal game log
  let sql_session_details = `
  SELECT sd.session_id, sd.attempts_per_game, sd.average_attempt, DATE(s.start_time) as start_date
  FROM SessionDetails AS sd
    JOIN Sessions AS s ON sd.session_id = s.session_id
    JOIN Players AS p ON s.player_id = p.player_id
  WHERE p.username = ?`;

  // Query database
  connection.query(sql_session_details, [username], (err, results) => {
    // If error executing query
    if (err) {
      console.error("Error executing query: ", err);
      return loadMainMenu();
    }

    // If no data
    if (results.length === 0) {
      console.error("No data found.\n\n");
      return loadMainMenu();
    }

    // Store data from query for printing
    let arr_sessions = []; // Array to hold session data for game log
    results.forEach((row) => {
      // Find object where s.session_id === row.session_id
      // If object exists, object is assigned to variable
      let session = arr_sessions.find((s) => s.session_id === row.session_id);

      // If session (for row) not found, create new session for row
      if (!session) {
        session = {
          session_id: row.session_id,
          session_date: row.start_date,
          attempts: [],
          average_attempt: row.average_attempt,
        };
        // Add to array
        arr_sessions.push(session);
      }

      // Add list of attempts per game
      session.attempts.push(row.attempts_per_game);
    });

    // Print user's game log
    console.log(`${colors.blue}Your Game History:${colors.reset}`);
    let session_counter = 1;
    arr_sessions.forEach((session) => {
      console.log(
        `${colors.cyan}\nSession ${session_counter}\nDate: ${session.session_date}${colors.reset}`
      );
      session.attempts.forEach((attempt, index) => {
        console.log(
          `${colors.cyan}Attempt ${index + 1}: ${attempt}${colors.reset}`
        );
      });
      console.log(
        `${colors.cyan}Session Average: ${session.average_attempt}${colors.reset}`
      );
      session_counter++;
    });
    console.log("\n");

    // Return to Main Menu
    loadMainMenu();
  });
}

// Starts new game (Guessing Game)
function startNewGame() {
  console.log("Starting new game...\n\n");
  game_start = new Date();

  // Delay startGame to prevent last input from being accepted as first input in game
  setTimeout(() => {
    startGame((attemptsPerGame, averagePerSession) => {
      game_end = new Date();
      updateSession(attemptsPerGame, averagePerSession);
    });
  }, 100);
}

// Updates database with user's new session
function updateSession(attemptsPerGame, averagePerSession) {
  if (attemptsPerGame.length > 0 && averagePerSession > 0) {
    // Prepare SQL to find user's player_id
    let sql_player_id = `
    SELECT player_id
    FROM Players
    WHERE username = ?`;

    // Query database
    connection.query(sql_player_id, [username], (err, results) => {
      // If error executing query
      if (err) {
        console.error("Error executing query: ", err);
        return loadMainMenu();
      }

      // If no data found
      if (results.length === 0) {
        console.error("No data found.\n\n");
        return loadMainMenu();
      }

      // Store user's player_id
      let player_id = results[0].player_id;

      // Prepare SQL to add new session into Sessions table
      let sql_add_session = `
      INSERT INTO Sessions (player_id, start_time, end_time)
      VALUES
        (?, ?, ?)`;

      connection.query(
        sql_add_session,
        [player_id, game_start, game_end],
        (err, results) => {
          // If error executing query
          if (err) {
            console.error("Error executing query: ", err.stack);
            return loadMainMenu();
          }

          console.log(`${colors.green}New session saved!${colors.reset}`);

          let session_id = results.insertId;
          let session_details_counter = 0;

          attemptsPerGame.forEach((attempt) => {
            let sql_update_session_details = `
              INSERT INTO SessionDetails (session_id, attempts_per_game, average_attempt)
              VALUES
                (?, ?, ?)`;

            connection.query(
              sql_update_session_details,
              [session_id, attempt, averagePerSession],
              (err, results) => {
                // If error executing query
                if (err) {
                  console.error("Error executing query: ", err.stack);
                  return loadMainMenu();
                }

                console.log(
                  `${colors.green}New session detail saved!${colors.reset}`
                );
                session_details_counter++;

                // If all rows have been inserted into Session Details table
                if (session_details_counter === attemptsPerGame.length) {
                  console.log("\n");
                  // Reset global variables
                  game_start = undefined;
                  game_end = undefined;
                  loadMainMenu(); // Return to the main menu
                }
              }
            );
          });
        }
      );
    });
  }
}

// Updates user information
function updateAcct() {
  console.log(`${colors.bgYellow}${colors.black}========================================
                                        
             UPDATE ACCOUNT             
                                        
      1: Update nickname                
      2: Update password                
      X: Quit to Main Menu              
                                        
========================================${colors.reset}`);

  // Get user input
  readline.question("Choose your action: ", (choice) => {
    switch (choice.toLowerCase()) {
      // Update nickname
      case "1":
        console.log(
          `${colors.yellow}You selected: Update nickname${colors.reset}\n\n`
        );
        updateNickname();
        break;

      // Update password
      case "2":
        console.log(
          `${colors.yellow}You selected: Update password${colors.reset}\n\n`
        );
        updatePassword();
        break;

      // Quit to Main Menu
      case "x":
        console.log(
          `${colors.yellow}You selected: Quit to Main Menu${colors.reset}\n\n`
        );
        loadMainMenu();
        break;

      // Invalid input
      default:
        console.error("Invalid input. Re-enter selection.\n\n");
        updateAcct();
    }
  });
}

// Updates nickname
function updateNickname() {
  // Get user input
  readline.question(
    "Enter your new nickname (3-50 characters): ",
    (new_nickname) => {
      // If nickname length is invalid
      if (new_nickname.length < 3 || new_nickname.length > 50) {
        console.error("New nickname must be 3 to 50 characters.");
        return updateNickname();
      }

      // Confirm user input
      readline.question(
        `You entered: ${new_nickname}. Confirm? (Yes or No): `,
        (confirm) => {
          switch (confirm.toLowerCase()) {
            // If user confirms new nickname
            case "yes":
              // Prepare SQL to update nickname
              let sql_update_nickname = `
              UPDATE Players
              SET nickname = ?
              WHERE username = ?`;

              // Query database
              connection.query(
                sql_update_nickname,
                [new_nickname, username],
                (err, results) => {
                  // If error executing
                  if (err) {
                    console.error("Error executing query: ", err);
                    return loadMainMenu();
                  }

                  // Nickname is updated
                  nickname = new_nickname; // Update global variable
                  console.log(
                    `${colors.green}Nickname updated!${colors.reset}\n\n`
                  );
                  loadMainMenu();
                }
              );
              break;

            // If user declines confirmation
            case "no":
              updateNickname();
              break;

            // Invalid input
            default:
              console.error("Invalid input. Re-enter new nickname.\n\n");
              updateNickname();
          }
        }
      );
    }
  );
}

// Updates password
function updatePassword() {
  // Get user input
  readline.question(
    "Enter your new password (8-20 characters): ",
    (new_password) => {
      // If password length is invalid
      if (new_password.length < 8 || new_password.length > 20) {
        console.error("Password must be 8 to 20 characters.");
        return updatePassword();
      }

      // Confirm user input
      readline.question(
        `You entered: ${new_password}. Confirm? (Yes or No): `,
        (confirm) => {
          switch (confirm.toLowerCase()) {
            // If user confirms new password
            case "yes":
              // Prepare SQL to update password
              let sql_update_password = `
              UPDATE Players
              SET password = ?
              WHERE username = ?`;

              // Query database
              connection.query(
                sql_update_password,
                [new_password, username],
                (err, results) => {
                  // If error executing
                  if (err) {
                    console.error("Error executing query: ", err);
                    return loadMainMenu();
                  }

                  // Password is updated
                  password = new_password; // Update global variable
                  console.log(
                    `${colors.green}Password updated!${colors.reset}\n\n`
                  );
                  loadMainMenu();
                }
              );
              break;

            // If user declines confirmation
            case "no":
              updatePassword();
              break;

            // Invalid input
            default:
              console.error("Invalid input. Re-enter new password.\n\n");
              updatePassword();
          }
        }
      );
    }
  );
}

// Loads Delete Account Page
function loadDeleteAcctPage() {
  console.log(`${colors.bgRed}${colors.white}========================================
                                        
              DELETE ACCOUNT            
                                        
    Deleting your account permanently   
    erases your account details and     
    history from our system.            
                                        
    It is an irreversible action. You   
    will be unable to recover your      
    account or game history.            
                                        
  Do you wish to continue? (Yes or No)  
                                        
          X: Quit to Main Menu          
                                        
========================================${colors.reset}`);

  // Get user input
  readline.question("Choose your action: ", (choice) => {
    // If user choose to return to Main Menu or decides not to delete account
    if (choice.toLowerCase() === "x" || choice.toLowerCase() === "no") {
      console.log(
        `${colors.yellow}You selected: Quit to Main Menu${colors.reset}\n\n`
      );
      loadMainMenu();

      // If user choose to delete account and game history
    } else if (choice.toLowerCase() === "yes") {
      console.log(`${colors.yellow}You entered: ${choice}${colors.reset}\n`);
      // Confirm user choice
      readline.question(
        `${colors.bgRed}${colors.white}Confirm? (Yes or No): ${colors.reset}`,
        (confirm) => {
          switch (confirm.toLowerCase()) {
            // If user confirms to delete
            case "yes":
              // Prepare SQL to delete personal session details
              let sql_del_sessionDetails = `
                DELETE sd
                FROM SessionDetails AS sd
                  JOIN Sessions AS s ON sd.session_id = s.session_id
                  JOIN Players AS p ON s.player_id = p.player_id
                WHERE p.username = ?`;

              // Query database
              connection.query(
                sql_del_sessionDetails,
                [username],
                (err, results) => {
                  // If error executing
                  if (err) {
                    console.error(
                      "Error executing session details deletion: ",
                      err.stack
                    );
                    return loadMainMenu();
                  }

                  // Deletion successful
                  console.log(
                    `${colors.green}Session Details deleted successfully!${colors.reset}`
                  );
                }
              );

              // Prepare SQL to delete personal sessions
              let sql_del_sessions = `
                DELETE s
                FROM Sessions AS s
                  JOIN Players AS p ON s.player_id = p.player_id
                WHERE p.username = ?`;

              // Query database
              connection.query(sql_del_sessions, [username], (err, results) => {
                if (err) {
                  console.error(
                    "Error executing sessions deletion: ",
                    err.stack
                  );
                  return loadMainMenu();
                }

                // Deletion successful
                console.log(
                  `${colors.green}Sessions deleted successfully!${colors.reset}`
                );
              });

              // Prepare SQL to delete user account
              let sql_del_player = `
                DELETE FROM Players
                WHERE username = ?`;

              // Query database
              connection.query(sql_del_player, [username], (err, results) => {
                // If error executing
                if (err) {
                  console.error(
                    "Error executing player account deletion: ",
                    err.stack
                  );
                  return loadMainMenu();
                }

                // Deletion successful
                console.log(
                  `${colors.green}Player account deleted successfully!${colors.reset}\n\n`
                );

                // Reset variables
                username = undefined;
                password = undefined;
                nickname = undefined;

                // Log out to Starting Page
                loadStartingPage();
              });
              break;

            // If user declines confirmation to delete
            case "no":
              loadDeleteAcctPage();
              break;

            // Invalid input
            default:
              console.error("Invalid input. Re-enter choice.\n\n");
              loadDeleteAcctPage();
          }
        }
      );

      // Invalid input
    } else {
      console.log("Invalid input. Re-enter choice.\n\n");
      loadDeleteAcctPage();
    }
  });
}

// Exits and ends script
function exit() {
  console.log("Exiting...");
  console.log(
    `${colors.bgBlue}Thank you for using Guessing Game!${colors.reset}\n`
  );
  connection.end(); // End connection to database
  readline.close(); // Close interface
  process.exit(0); // Terminate Node processes without error
}

// Start script
loadStartingPage();
