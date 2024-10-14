// User data
const users = ["John Doe", "Jane Doe", "Admin"];
const acct_no = ["123561283", "526715843", undefined];
var pins = ["1234", "1111", "0000"];
var user_balance = [15, 50000, undefined];

// ATM data
const denominations = [10, 20, 50, 100]; // Note denomination
var stacksize_notes = [100, 100, 100, 100]; // Number of notes for each denomination
var atm_balance = 0; // Calculated amount of money left inside ATM

// Login page
var is_card_inserted = false;
var pin_input = ""; // PIN input
var is_logged_in = false; // Check for sucessful login
var err_counter = 0; // Counter for invalid PIN entries
var user_index; // Index for user

// Withdraw page
var withdraw_input = "";

// Deposit page
var deposit_input = "";

// Admin only
var admin_msg = "";

// Interval ID for image transitions
var img_transition_interval;

// When load, start ads
window.onload = playAds;

// Makes images transition
function playAds() {
  // Get array of images
  var imgs = document.getElementsByClassName("ads");

  // Set opacity
  for (let i = 0; i < imgs.length; i++) {
    imgs[i].style.opacity = 1;
  }

  var topmost = 1; // Z-index of topmost image
  var curr_img = imgs.length - 1; // Index of current image

  // Change images every 3 seconds
  img_transition_interval = setInterval(changeImg, 3000);

  // Fades out current image while fading in next image
  async function changeImg() {
    // Index of next image
    var next_img = (1 + curr_img) % imgs.length;

    // Make sure image below current image is next image
    imgs[curr_img].style.zIndex = topmost + 1;
    imgs[next_img].style.zIndex = topmost;

    // Complete transition
    await transition();

    // Set z-indices of current and next images
    imgs[curr_img].style.zIndex = topmost;
    imgs[next_img].style.zIndex = topmost + 1;

    // Increase topmost
    topmost += 1;

    // Reset opacity of current image to 1
    imgs[curr_img].style.opacity = 1;

    // Set next image as current image
    curr_img = next_img;
  }

  // Changes opacity of current image at regular intervals
  function transition() {
    return new Promise((resolve, reject) => {
      // ID for setInterval to clear/stop setInterval after changing opacity
      var set_interval_id = setInterval(changeOpacity, 10);

      // Decrease opacity of current image
      // When opacity reaches 0, stop/clear setInterval and resolve the function
      function changeOpacity() {
        // Decrease opacity of current image at every interval
        imgs[curr_img].style.opacity -= 0.01;

        // When opacity reaches 0
        if (imgs[curr_img].style.opacity <= 0) {
          // Stop/clear setInterval
          clearInterval(set_interval_id);
          resolve();
        }
      }
    });
  }
}

// Stops all ads and begin ATM processes
function startAtm() {
  // Card inserted. Cannot be removed unless ejected
  is_card_inserted = true;
  document.getElementById("btn-card-slot").classList.remove("btn-card-active");
  document.getElementById("btn-card-slot").classList.add("inactive-buttons");

  // Clear the interval that handles image transitions
  if (img_transition_interval) {
    clearInterval(img_transition_interval);
  }

  // Hide ads
  let imgs = document.getElementsByClassName("ads");
  for (let i = 0; i < imgs.length; i++) {
    imgs[i].style.display = "none";
  }

  // Load login page
  loadPage("login-page");
}

// Loads relevant page
function loadPage(page_name) {
  // Remove previous elements
  let page_checker = document.querySelectorAll("h2");
  if (page_checker.length > 0) {
    wipePage(page_checker[0].className);
  }

  let atm_screen = document.getElementById("atm-screen");

  // Login Page
  if (page_name === "login-page") {
    // Page content
    let page_elements = ["h2", "h3", "input", "h4"];
    let element_textContents = [
      "WELCOME TO XYZ BANK",
      "Enter Your PIN:",
      undefined,
      "ERROR: Invalid PIN",
    ];

    // Add page contents
    for (let i = 0; i < page_elements.length; i++) {
      let new_element = document.createElement(page_elements[i]); // Create new element
      new_element.className = "login-page"; // Add common class
      // Add attributes for input field
      if (page_elements[i] === "input") {
        new_element.id = "inp-pin";
        new_element.type = "password";
      }

      // Add text content
      if (element_textContents[i] !== undefined) {
        new_element.textContent = element_textContents[i];
      }

      // Add error class for error message
      if (element_textContents[i] === "ERROR: Invalid PIN") {
        new_element.classList.add("errors");
      }
      atm_screen.append(new_element); // Add to ATM screen
    }

    // Main Page
  } else if (page_name === "main-page") {
    if (is_logged_in) {
      // Page content
      let page_elements = [
        "h2",
        "br",
        "h3",
        "br",
        "h4",
        "br",
        "h4",
        "h4",
        "h4",
        "h4",
      ];
      let element_textContents = [
        `WELCOME, ${users[user_index]}`,
        undefined,
        `Account number: ${acct_no[user_index]}`,
        undefined,
        "What would you like to do?",
        undefined,
        "See Balance",
        "Withdraw",
        "Deposit",
        "Log Out",
      ];

      // Add page contents
      for (let i = 0; i < page_elements.length; i++) {
        let new_element = document.createElement(page_elements[i]); // Create new element
        new_element.className = "main-page"; // Add common class

        // Add text to elements
        if (element_textContents[i] !== undefined) {
          new_element.textContent = element_textContents[i];
        }

        // Align text to screen buttons
        if (element_textContents[i] === "See Balance") {
          new_element.style.position = "absolute";
          new_element.style.bottom = "60%";
          new_element.style.right = "0.5%";
        } else if (element_textContents[i] === "Withdraw") {
          new_element.style.position = "absolute";
          new_element.style.bottom = "35%";
          new_element.style.right = "0.5%";
        } else if (element_textContents[i] === "Deposit") {
          new_element.style.position = "absolute";
          new_element.style.bottom = "10%";
          new_element.style.right = "0.5%";
        } else if (element_textContents[i] === "Log Out") {
          new_element.style.position = "absolute";
          new_element.style.bottom = "10%";
          new_element.style.left = "0.5%";
        }

        atm_screen.append(new_element); // Add to ATM screen
      }
    }

    // Balance Page
  } else if (page_name === "balance-page") {
    // Page content
    let page_elements = ["h2", "br", "h3", "br", "h4"];
    let element_textContents = [
      `Dear, ${users[user_index]}`,
      undefined,
      `Balance: $${user_balance[user_index]}`,
      undefined,
      "Back",
    ];

    // Add page contents
    for (let i = 0; i < page_elements.length; i++) {
      let new_element = document.createElement(page_elements[i]); // Create new element
      new_element.className = "balance-page"; // Add common class

      // Add text to elements
      if (element_textContents[i] !== undefined) {
        new_element.textContent = element_textContents[i];
      }

      // Align text to screen buttons
      if (element_textContents[i] === "Back") {
        new_element.style.position = "absolute";
        new_element.style.bottom = "10%";
        new_element.style.right = "0.5%";
      }

      atm_screen.append(new_element); // Add to ATM screen
    }

    // Withdraw Page
  } else if (page_name === "withdraw-page") {
    // Page content
    let page_elements = ["h2", "br", "h3", "input", "h4"];
    let element_textContents = [
      `Dear, ${users[user_index]}`,
      undefined,
      "Enter Withdraw Amount:",
      undefined,
      "ERROR: Invalid Amount",
    ];

    // Add page contents
    for (let i = 0; i < page_elements.length; i++) {
      let new_element = document.createElement(page_elements[i]); // Create new element
      new_element.className = "withdraw-page"; // Add common class

      // Add attributes for input field
      if (page_elements[i] === "input") {
        new_element.id = "inp-withdraw";
      }

      // Add text to elements
      if (element_textContents[i] !== undefined) {
        new_element.textContent = element_textContents[i];
      }

      // Add error class for error message
      if (element_textContents[i] === "ERROR: Invalid Amount") {
        new_element.classList.add("errors");
      }

      atm_screen.append(new_element); // Add to ATM screen
    }

    // Deposit Page
  } else if (page_name === "deposit-page") {
    // Page content
    let page_elements = ["h2", "br", "h3", "input", "h4"];
    let element_textContents = [
      `Dear, ${users[user_index]}`,
      undefined,
      "Enter Deposit Amount:",
      undefined,
      "ERROR: Invalid Amount",
    ];

    // Add page contents
    for (let i = 0; i < page_elements.length; i++) {
      let new_element = document.createElement(page_elements[i]); // Create new element
      new_element.className = "deposit-page"; // Add common class

      // Add attributes for input field
      if (page_elements[i] === "input") {
        new_element.id = "inp-deposit";
      }

      // Add text to elements
      if (element_textContents[i] !== undefined) {
        new_element.textContent = element_textContents[i];
      }

      // Add error class for error message
      if (element_textContents[i] === "ERROR: Invalid Amount") {
        new_element.classList.add("errors");
      }

      atm_screen.append(new_element); // Add to ATM screen
    }

    // Logout Page
  } else if (page_name === "logout-page") {
    // Page content
    let page_elements = ["h2", "br", "h3"];
    let element_textContents = [
      `Dear, ${users[user_index]}`,
      undefined,
      "Have a good day!",
    ];

    // Add page contents
    for (let i = 0; i < page_elements.length; i++) {
      let new_element = document.createElement(page_elements[i]); // Create new element
      new_element.className = "logout-page"; // Add common class

      // Add text to elements
      if (element_textContents[i] !== undefined) {
        new_element.textContent = element_textContents[i];
      }

      atm_screen.append(new_element); // Add to ATM screen
    }

    // Admin Only Page
  } else if (page_name === "admin-only-page") {
    if (is_logged_in) {
      // Page content
      let page_elements = [
        "h2",
        "br",
        "h4",
        "br",
        "h4",
        "br",
        "h4",
        "h4",
        "h4",
      ];
      let element_textContents = [
        `WELCOME, ${users[user_index]}`,
        undefined,
        `${admin_msg}`,
        undefined,
        "What would you like to do?",
        undefined,
        "Reset Balance",
        "Log Out",
        "Reset successful!",
      ];

      // Add page contents
      for (let i = 0; i < page_elements.length; i++) {
        let new_element = document.createElement(page_elements[i]); // Create new element
        new_element.className = "admin-only-page"; // Add common class

        // Add text to elements
        if (element_textContents[i] !== undefined) {
          new_element.innerHTML = element_textContents[i];
        }

        // Align text to screen buttons
        if (element_textContents[i] === "Reset Balance") {
          new_element.style.position = "absolute";
          new_element.style.bottom = "10%";
          new_element.style.right = "0.5%";
        } else if (element_textContents[i] === "Log Out") {
          new_element.style.position = "absolute";
          new_element.style.bottom = "10%";
          new_element.style.left = "0.5%";
        }

        // Add error class for error message
        if (element_textContents[i] === "Reset successful!") {
          new_element.classList.add("success");
        }

        atm_screen.append(new_element); // Add to ATM screen
      }
    }
  }
}

// Appends number
function appendNumber(num) {
  let find_input = document.querySelector("input");

  if (find_input !== null && is_card_inserted) {
    // Hide error when re-entering
    let err_elements = document.getElementsByClassName("errors");
    if (err_elements[0].style.opacity === "1") {
      err_elements[0].style.opacity = 0;
    }

    let inputs = document.querySelectorAll("input"); // Get array of inputs

    // If PIN
    if (inputs[0].id === "inp-pin" && pin_input.length < 4) {
      pin_input += num;
      updateDisplay();

      // If Withdraw
    } else if (inputs[0].id === "inp-withdraw" && withdraw_input.length < 5) {
      if (
        (withdraw_input.length < 1 && num !== 0) ||
        withdraw_input.length >= 1
      ) {
        withdraw_input += num;
        updateDisplay();
      }

      // If Deposit
    } else if (inputs[0].id === "inp-deposit" && deposit_input.length < 5) {
      if (
        (deposit_input.length < 1 && num !== 0) ||
        deposit_input.length >= 1
      ) {
        deposit_input += num;
        updateDisplay();
      }
    }
  }
}

// Updates input field
function updateDisplay() {
  let inputs = document.querySelectorAll("input"); // Get array of inputs

  if (inputs[0].id === "inp-pin") {
    inputs[0].value = pin_input;
  } else if (inputs[0].id === "inp-withdraw") {
    inputs[0].value = withdraw_input;
  } else if (inputs[0].id === "inp-deposit") {
    inputs[0].value = deposit_input;
  }
}

// Clears input
function backspace() {
  let find_input = document.querySelector("input");

  if (find_input !== null && is_card_inserted) {
    let inputs = document.querySelectorAll("input"); // Get array of inputs

    if (inputs[0].id === "inp-pin") {
      pin_input = pin_input.slice(0, -1);
    } else if (inputs[0].id === "inp-withdraw") {
      withdraw_input = withdraw_input.slice(0, -1);
    } else if (inputs[0].id === "inp-deposit") {
      deposit_input = deposit_input.slice(0, -1);
    }

    updateDisplay();
  }
}

// Cancels input process and returns to previous page
function cancel() {
  let find_input = document.querySelector("input");
  let page_checker = document.querySelectorAll("h2"); // Get array of h2

  if (find_input !== null && is_card_inserted) {
    // If on login page
    if (page_checker[0].className === "login-page") {
      wipePage(page_checker[0].className);

      // Reset variables
      pin_input = "";
      is_logged_in = false;
      err_counter = 0;
      user_index = undefined;
      withdraw_input = "";
      deposit_input = "";

      // Eject card
      ejectCard();

      // Unhide ads
      let imgs = document.getElementsByClassName("ads");
      for (let i = 0; i < imgs.length; i++) {
        imgs[i].style.display = "initial";
      }

      // Restart ads
      playAds();

      // If on withdraw/deposit page
    } else if (
      page_checker[0].className === "withdraw-page" ||
      page_checker[0].className === "deposit-page"
    ) {
      wipePage(page_checker[0].className);

      // Reset withdraw and deposit inputs
      withdraw_input = "";
      deposit_input = "";

      // Return to main page
      loadPage("main-page");
    }
  } else if (is_card_inserted) {
    // If on logout page
    if (page_checker[0].className === "logout-page") {
      wipePage(page_checker[0].className);

      // Reset variables
      pin_input = "";
      is_logged_in = false;
      err_counter = 0;
      user_index = undefined;
      withdraw_input = "";
      deposit_input = "";

      // Eject card
      ejectCard();

      // Unhide ads
      let imgs = document.getElementsByClassName("ads");
      for (let i = 0; i < imgs.length; i++) {
        imgs[i].style.display = "initial";
      }

      // Restart ads
      playAds();
    }
  }
}

// Ensures page elements are completely removed
function wipePage(pageClassName) {
  let page_elements = document.getElementsByClassName(pageClassName);
  while (page_elements.length > 0) {
    page_elements[0].remove();
  }
}

// Processes input values
function enter() {
  var find_input = document.querySelector("input");

  if (find_input !== null && is_card_inserted) {
    // Get array of inputs
    let page_checker = document.querySelectorAll("h2");

    // If on login page
    if (page_checker[0].className === "login-page") {
      // Check PIN
      user_index = pins.indexOf(pin_input);

      // If correct pin entered
      if (user_index !== -1) {
        // Successful login
        is_logged_in = true;

        // Go to Admin Only page
        if (users[user_index] === "Admin") {
          readNotesStackSize();
          loadPage("admin-only-page");
          // Go to main page
        } else {
          loadPage("main-page");
        }

        // Reset error counter
        err_counter = 0;
      } else {
        // Reset user_index
        user_index = undefined;

        // Reset PIN input
        pin_input = "";
        updateDisplay();

        // Display error
        let err_elements = document.getElementsByClassName("errors");
        err_elements[0].style.opacity = 1;

        // Count errors
        err_counter += 1;

        // If maximum login attempts reached
        if (err_counter === 3) {
          err_elements[0].textContent =
            "Maximum login attempts reached. Card rejected.";

          // Wait 3 seconds before ejecting the card
          setTimeout(() => {
            // Clear screen
            cancel();

            // Reset error counter
            err_counter = 0;
          }, 3000);
        }
      }

      // If on withdraw page
    } else if (page_checker[0].className === "withdraw-page") {
      // Get withdrawal amount
      let requested_withdrawal = parseInt(
        document.getElementById("inp-withdraw").value
      );

      // Get message after withdraw request check
      let [withdrawal_msg, is_withdraw_valid] =
        checkRequestedAmount(requested_withdrawal);

      // Get elements to display error
      let err_elements = document.getElementsByClassName("errors");

      // If withdraw request check is valid
      if (is_withdraw_valid === true) {
        // Check how much money is left inside ATM
        atm_balance = checkAtmBalance();

        // If ATM has sufficient money and user have sufficient balance
        if (
          atm_balance >= requested_withdrawal &&
          requested_withdrawal <= user_balance[user_index]
        ) {
          // Proceed to withdraw
          withdrawal_msg = withdraw();

          // Display withdrawal success message (change error message to success message)
          err_elements[0].style.color = "green";
          err_elements[0].innerHTML = withdrawal_msg;
          err_elements[0].style.opacity = 1;

          // If user's balance is insufficient, regardless if ATM has sufficient money
        } else if (requested_withdrawal > user_balance[user_index]) {
          withdrawal_msg = `Your balance is insufficient. Withdrawal failed.`;
          err_elements[0].innerHTML = withdrawal_msg;
          err_elements[0].style.opacity = 1;

          // If ATM has insufficient money
        } else {
          withdrawal_msg = `ATM has insufficient funds.<br />Your request for $${requested_withdrawal} has been declined.`;

          // Display error
          err_elements[0].innerHTML = withdrawal_msg;
          err_elements[0].style.opacity = 1;
        }

        // Wait 3 seconds before returning to main page
        setTimeout(() => {
          // Clear screen
          cancel();
        }, 3000);

        // If withdraw request check is invalid
      } else {
        // Display error
        err_elements[0].textContent = withdrawal_msg;
        err_elements[0].style.opacity = 1;
      }
      // Reset withdraw input
      withdraw_input = "";
      updateDisplay();

      // If on deposit page
    } else if (page_checker[0].className === "deposit-page") {
      // Get deposit amount
      let requested_deposit = parseInt(
        document.getElementById("inp-deposit").value
      );

      // Get message after deposit request check
      let [deposit_msg, is_deposit_valid] =
        checkRequestedAmount(requested_deposit);

      // Get elements to display error
      let err_elements = document.getElementsByClassName("errors");

      // If deposit request check is valid
      if (is_deposit_valid === true) {
        // Proceed to deposit
        deposit_msg = deposit();

        // Display deposit success message (change error message to success message)
        err_elements[0].style.color = "green";
        err_elements[0].innerHTML = deposit_msg;
        err_elements[0].style.opacity = 1;

        // Wait 3 seconds before returning to main page
        setTimeout(() => {
          // Clear screen
          cancel();
        }, 3000);
      } else {
        // Display error
        err_elements[0].textContent = deposit_msg;
        err_elements[0].style.opacity = 1;
      }

      // Reset withdraw input
      deposit_input = "";
      updateDisplay();
    }
  }
}

// Checks if withdrawal request is valid
function checkRequestedAmount(input_value) {
  // Not in single dollars
  if (input_value % 10 !== 0) {
    return ["ERROR: Requested amount must be in multiples of 10.", false];
    // Below $10
  } else if (input_value < 10) {
    return ["ERROR: Requested amount too low. $10 minimum.", false];
    // More than $99,990
  } else if (input_value > 99990) {
    return ["ERROR: Requested amount too high. $99,990 maximum.", false];
    // Valid number
  } else {
    return [undefined, true];
  }
}

// Checks leftover money inside ATM
function checkAtmBalance() {
  // Reset ATM balance for fresh calculation
  atm_balance = 0;

  // Calculate ATM balance
  for (let i = 0; i < denominations.length; i++) {
    atm_balance += denominations[i] * stacksize_notes[i];
  }

  return atm_balance;
}

// Calculates how many notes of each denomination is withdrawn
function withdraw() {
  // Get original requested withdrawal amount
  let ori_withdrawal_amount = parseInt(
    document.getElementById("inp-withdraw").value
  );

  // Preset leftover after withdrawal
  let withdrawal_leftover = ori_withdrawal_amount;

  // Preset number of withdrawn notes for each denomination
  let notes_withdrawn = new Array(denominations.length).fill(0);

  // Calculate in reverse order (high to low denomination)
  for (let i = denominations.length - 1; i >= 0; i--) {
    // If withdrawal is complete, stop loop
    if (withdrawal_leftover == 0) break;

    // Calculate the max number of notes of this denomination we can use
    let notes_needed = Math.min(
      Math.floor(withdrawal_leftover / denominations[i]),
      stacksize_notes[i]
    );

    // Update the number of withdrawn notes, stack size and leftover after withdrawal
    notes_withdrawn[i] = notes_needed;
    stacksize_notes[i] -= notes_needed;
    withdrawal_leftover -= notes_needed * denominations[i];
  }

  // Update user balance
  updateUserBalance(-ori_withdrawal_amount);

  // Print successful withdrawal message
  var successful_withdrawal_msg = "SUCCESS: You will receive:";
  for (let i = notes_withdrawn.length - 1; i >= 0; i--) {
    if (notes_withdrawn[i] > 0) {
      successful_withdrawal_msg += `<br />${notes_withdrawn[i]} x $${denominations[i]} notes`;
    }
  }

  return successful_withdrawal_msg;
}

// Calculates how many notes of each denomination is deposited
function deposit() {
  // Get original requested deposit amount
  let ori_deposit_amount = parseInt(
    document.getElementById("inp-deposit").value
  );

  // Preset leftover after withdrawal
  let deposit_leftover = ori_deposit_amount;

  // Preset number of deposit notes for each denomination
  let notes_deposited = new Array(denominations.length).fill(0);

  // Calculate in reverse order (high to low denomination)
  for (let i = denominations.length - 1; i >= 0; i--) {
    // If deposit is complete, stop loop
    if (deposit_leftover == 0) break;

    // Calculate the number of notes of this denomination we can use
    var notes_needed = Math.floor(deposit_leftover / denominations[i]);

    // Update the number of deposited notes, stack size and leftover after deposit
    notes_deposited[i] = notes_needed;
    stacksize_notes[i] += notes_needed;
    deposit_leftover -= notes_needed * denominations[i];
  }

  // Update user balance
  updateUserBalance(ori_deposit_amount);

  // Print successful deposit message
  var successful_deposit_msg = "SUCCESS: You deposited:";
  for (let i = notes_deposited.length - 1; i >= 0; i--) {
    if (notes_deposited[i] > 0) {
      successful_deposit_msg += `<br />${notes_deposited[i]} x $${denominations[i]} notes`;
    }
  }

  return successful_deposit_msg;
}

// Updates user's balance
function updateUserBalance(amount) {
  user_balance[user_index] += amount;
}

// Reading available note stacks (for Admin only)
function readNotesStackSize() {
  admin_msg = "ATM Balance:";
  for (let i = 0; i < denominations.length; i++) {
    admin_msg += `<br />$${denominations[i]}: ${stacksize_notes[i]}`;
  }
}

// Ejects card
function ejectCard() {
  is_card_inserted = false;
  document.getElementById("btn-card-slot").classList.remove("inactive-buttons");
  document.getElementById("btn-card-slot").classList.add("btn-card-active");
}

// Presses left button
function leftScreenBtn() {
  if (is_card_inserted) {
    let page_checker = document.querySelectorAll("h2");

    // Log Out from Main Page to Ads
    if (
      page_checker[0].className === "main-page" ||
      page_checker[0].className === "admin-only-page"
    ) {
      loadPage("logout-page");

      // Wait 3 seconds before returning to main page
      setTimeout(() => {
        // Clear screen
        cancel();
      }, 3000);
    }
  }
}

// Presses right button
function rightScreenBtn(num) {
  if (is_card_inserted) {
    let page_checker = document.querySelectorAll("h2");

    // Go to Balance Page from Main Page
    if (num === 3 && page_checker[0].className === "main-page") {
      loadPage("balance-page");

      // Go to Withdraw Page from Main Page
    } else if (num === 2 && page_checker[0].className === "main-page") {
      loadPage("withdraw-page");

      // Go to Deposit Page from Main Page
    } else if (num === 1 && page_checker[0].className === "main-page") {
      loadPage("deposit-page");

      // Return to Main Page from Balance Page
    } else if (num === 1 && page_checker[0].className === "balance-page") {
      loadPage("main-page");

      // Go to ATM Reset Page from Admin Only Page
    } else if (num === 1 && page_checker[0].className === "admin-only-page") {
      // Reset stacksize
      stacksize_notes = [100, 100, 100, 100];
      readNotesStackSize();
      loadPage("admin-only-page");

      // Display reset success message
      let reset_success_msgs = document.getElementsByClassName("success");
      reset_success_msgs[0].style.opacity = 1;

      // Wait 3 seconds before turning off reset success message
      setTimeout(() => {
        // Turn off reset success message
        reset_success_msgs[0].style.opacity = 0;
      }, 3000);
    }
  }
}
