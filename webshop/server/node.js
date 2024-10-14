// Import modules
import http from "http"; // HTTP module to create a server
import { URL, fileURLToPath } from "url"; // URL module to parse request URLs
import mysql from "mysql2/promise"; // MySQL2 module to process database
import bcrypt from "bcrypt"; // bcrypt module to handle passwords
import crypto from "crypto"; // cryto module to handle email encryption/decryption and authentication tag
import dotenv from "dotenv"; // dotenv module to handle .env
import nodemailer from "nodemailer"; // nodemailer module to handle emails to customer
import { setInterval, clearInterval } from "timers"; // timers module to run checks (for auto-rollback)
import puppeteer from "puppeteer"; // puppeteer module to generate PDF
import { dirname, join } from "path"; // path module to work with files and directories
import fs from "fs"; // file system module to read, write, append or delete files

// import { connect } from "http2";

dotenv.config(); // Load environment variables from .env file

// Global variables
var interval_id; // For timers module
var is_rollback = false; // Tracks whether a rollback has been called

// Stops the interval
function stopRollbackCheck() {
  clearInterval(interval_id);
}

// Checks for expired transactions
function checkForExpiredTransactions(email, response) {
  if (is_rollback === false) {
    // Prepare SQL to check for expired transactions
    const sql_check_expired = `
    SELECT tt.TransactionID, tt.CustomerID, tt.ExpirationTime
    FROM TransactionTimeouts AS tt
      JOIN Customers AS c ON c.CustomerID = tt.CustomerID
    WHERE tt.ExpirationTime < NOW()
      AND c.Email = ?`;

    // Check for expired transactions
    connection.query(sql_check_expired, [email], (error, results) => {
      if (error) {
        console.error("Error querying expired transactions:", error);
        return;
      }

      // If an expired transaction exists
      if (results.length > 0) {
        connection.rollback();
        is_rollback = true;
        stopRollbackCheck();
        response.statusCode = 200;
        response.end(JSON.stringify({ message: "Checkout Timed Out" }));
      }
    });
  }
}

// Converts a base64-encoded string to a Uint8Array
function base64ToUint8Array(base64) {
  // Decode the base64 string into a binary string
  const binaryString = Buffer.from(base64, "base64").toString("binary");

  // Create a Uint8Array with the length of the binary string
  const bytes = new Uint8Array(binaryString.length);

  // Populate the Uint8Array with the byte values of the binary string
  for (let i = 0; i < binaryString.length; i++) {
    // Convert each character to its corresponding byte value
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

// Encrypts the given email address
function encryptEmail(email) {
  // Convert the base64-encoded secret key from environment variable to a Uint8Array
  const key = base64ToUint8Array(process.env.SECRET_KEY);

  // Convert the base64-encoded initialization vector (IV) from environment variable to a Uint8Array
  const iv = base64ToUint8Array(process.env.FIXED_IV);

  // Create a cipher object using the specified algorithm, key, and IV
  const cipher = crypto.createCipheriv(process.env.ALGORITHM, key, iv);

  // Encrypt the email address and encode the result as a base64 string
  let encrypted_email = cipher.update(email, "utf8", "base64");
  encrypted_email += cipher.final("base64");

  // Get the authentication tag (used for integrity verification) and encode it as a base64 string
  const tag = cipher.getAuthTag().toString("base64");

  return { encrypted_email, tag };
}

// Decrypts the given encrypted email address using the provided authentication tag
function decryptEmail(encrypted_email, tag) {
  // Convert the base64-encoded secret key from environment variable to a Uint8Array
  const key = base64ToUint8Array(process.env.SECRET_KEY);

  // Convert the base64-encoded initialization vector (IV) from environment variable to a Uint8Array
  const iv = base64ToUint8Array(process.env.FIXED_IV);

  // Create a decipher object using the specified algorithm, key, and IV
  const decipher = crypto.createDecipheriv(process.env.ALGORITHM, key, iv);

  // Set the authentication tag (used for integrity verification) for the decipher object
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  // Decrypt the encrypted email and decode the result as a UTF-8 string
  let decrypted_email = decipher.update(encrypted_email, "base64", "utf8");
  decrypted_email += decipher.final("utf8");

  return decrypted_email;
}

// Generates a random code of specified length
function generateRandomCode(length) {
  // Characters that can be used in the random code
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = ""; // Variable hold the random code

  // Get the total number of characters in the characters string
  const char_length = characters.length;

  // Generate a random character for each position in the code
  for (let i = 0; i < length; i++) {
    // Generate a random index within the range of characters
    const random_index = Math.floor(Math.random() * char_length);
    result += characters[random_index];
  }

  return result;
}

// Generates a PDF from the provided HTML content
async function generatePdf(order_html) {
  // Launch a new instance of Puppeteer (a headless browser)
  const browser = await puppeteer.launch();

  // Create a new page in the browser
  const page = await browser.newPage();

  // Define the path where the PDF will be saved
  const pdf_path = join(
    dirname(fileURLToPath(import.meta.url)),
    "order_confirmation.pdf"
  );

  // Set the content of the page to the provided HTML
  await page.setContent(order_html);

  // Generate and save the PDF to the specified path with A4 format
  await page.pdf({ path: pdf_path, format: "A4" });

  // Close the browser instance
  await browser.close();

  return pdf_path; // Return the path where the PDF was saved
}

// Creates a test account on Ethereal
async function createTestAccount() {
  const account = await nodemailer.createTestAccount();
  return account;
}

// Sends email
async function sendEmail(email, subject, page, file_path) {
  const account = await createTestAccount();

  // Create a transporter using Ethereal's SMTP settings
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: account.user, // Ethereal user
      pass: account.pass, // Ethereal pass
    },
  });

  // Define email options
  let mailOptions;
  if (file_path) {
    mailOptions = {
      from: '"Customer Support" <support@dngo.com>', // Sender address
      to: email, // List of recipients
      subject: subject, // Subject line
      html: page, // HTML body with Google Fonts link
      attachments: [
        {
          filename: "order_confirmation.pdf",
          path: file_path,
        },
      ],
    };
  } else {
    mailOptions = {
      from: '"Customer Support" <support@dngo.com>', // Sender address
      to: email, // List of recipients
      subject: subject, // Subject line
      html: page, // HTML body with Google Fonts link
    };
  }

  // Send email
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    // Cleanup: Delete the PDF file after sending
    if (file_path) {
      fs.unlinkSync(file_path);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// MySQL connection configuration
const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "webshop_db",
});

// Connect to database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: ", err.stack);
    process.exit(1); // Terminate Node processes with error
  }
});

// Create an HTTP server
const server = http.createServer(async (request, response) => {
  // Set CORS headers to allow cross-origin requests
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS request
  if (request.method === "OPTIONS") {
    response.statusCode = 204; // No content
    response.end();
    return;
  }

  // Parse the URL from the incoming request
  const url = new URL(request.url, `http://${request.headers.host}`);

  // Extract the pathname from the URL
  const pathname = url.pathname;

  // Route - POST login details for authentication
  if (request.method === "POST" && pathname.includes("login")) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Look for user based on email and compare passwords
    request.on("end", async () => {
      try {
        const { email, password } = JSON.parse(body); // Get login details from client

        // Prepare SQL to search database for hashed passwords based on login emails
        const sql_login = `
          SELECT HashedPassword
          FROM Customers
          WHERE Email = ?`;

        // Search for hashed passwords with login emails
        const [rows] = await connection.execute(sql_login, [email]);

        // If login email is not found
        if (rows.length === 0) {
          response.end(JSON.stringify({ error: "Invalid email or password" }));
          return;
        }

        // If login email is found, check for login passwords
        const is_matched = bcrypt.compare(password, rows[0].HashedPassword);

        // If there is a matching password,
        if (is_matched) {
          // Encrypt login email
          const { encrypted_email, tag } = encryptEmail(email);

          // Prepare SQL to update login status
          const sql_update_login = `
            UPDATE Customers
            SET isLoggedIn = 1
            WHERE Email = ?`;

          // Update login status
          await connection.execute(sql_update_login, [email]);

          // Send response to client
          // Provide encrypted email and authentication tag to be stored in local storage
          response.statusCode = 200;
          response.end(
            JSON.stringify({
              message: "Login successful",
              exists: true,
              email: encrypted_email,
              auth_tag: tag,
            })
          );

          // If there is no matching password
        } else {
          response.end(JSON.stringify({ error: "Invalid email or password" }));
        }

        // If there are database or bcrypt errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST email details for email validation in registration and password reset
  } else if (
    (request.method === "POST" && pathname.includes("validate-email")) ||
    (request.method === "POST" && pathname.includes("send-code"))
  ) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Check if email entered already exists in database
    request.on("end", async () => {
      try {
        const { email } = JSON.parse(body); // Get registration/registered email from client

        // Prepare SQL to search database for existing customers
        const sql_existing_email = `
          SELECT *
          FROM Customers
          WHERE Email = ?`;

        // Search for existing customers
        const [rows] = await connection.execute(sql_existing_email, [email]);

        // If customer is registered
        if (rows.length > 0) {
          // If this is a POST request to reset password
          if (pathname.includes("send-code")) {
            const code = generateRandomCode(4); // Generate random 4-character code

            // HTML password reset page with code to be emailed to customer
            const password_reset_page = `
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <link
                    href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"
                    rel="stylesheet"
                  />
                  <link
                    href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
                    rel="stylesheet"
                  />

                  <style>
                    .emoji {
                      font-family: "Noto Color Emoji", sans-serif;
                      font-weight: 400;
                      font-style: normal;
                    }

                    .brand {
                      font-family: "Nunito", sans-serif;
                      font-optical-sizing: auto;
                      font-weight: 1000;
                      font-style: normal;
                      text-align: center;
                    }

                    .code {
                      text-align: center;
                      background-color: azure;
                    }

                    body {
                      font-family: sans-serif;
                    }
                    #wrapper {
                      width: 60vw;
                      margin: auto;
                    }
                  </style>
                </head>
                <body>
                  <div id="wrapper">
                    <h1 class="brand"><span class="emoji">🍡</span> DNGO</h1>
                    <br />
                    <h3>Password Reset Requested</h3>
                    <p>Hi, ${rows[0].FirstName} ${rows[0].LastName}!<br />Your verification code is here:</p>
                    <br />
                    <h2 class="code">${code}</h2>
                    <br />
                    <p>
                      If you did not request this code, or if you are having issues accessing
                      your account, please contact our support team at 1800-3646.
                    </p>
                  </div>
                </body>
              </html>`;

            // Prepare SQL to add reset code to database
            const sql_add_code = `
              UPDATE Customers
              SET Code = ?
              WHERE Email = ?`;

            // Add reset code to database
            await connection.execute(sql_add_code, [code, email]);

            // Email code to customer
            sendEmail(
              email,
              "DNGO: Password Reset Verification Code",
              password_reset_page,
              false
            );
          }

          // Send response to client that registration email already exists
          response.end(JSON.stringify({ exists: true }));
          return;
        }

        // Send response to client that registration email does not exist
        response.statusCode = 200;
        response.end(JSON.stringify({ exists: false }));

        // If there are database or emailing errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST customer details for registration
  } else if (request.method === "POST" && pathname.includes("register")) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Process registration
    request.on("end", async () => {
      try {
        // Get registration details from client
        const {
          fname,
          lname,
          email,
          password,
          phone,
          street,
          city,
          state,
          postcode,
          country,
        } = JSON.parse(body);

        // Hash password to be stored in database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare SQL to add new customer to database
        const sql_add_customer = `
          INSERT INTO Customers (FirstName, LastName, Email, HashedPassword, PhoneNumber, Street, City, State, Postcode, Country, isLoggedIn) VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;

        // Add new customer
        const [rows] = await connection.execute(sql_add_customer, [
          fname,
          lname,
          email,
          hashedPassword,
          phone,
          street,
          city,
          state,
          postcode,
          country,
        ]);

        // Encrypt email
        const { encrypted_email, tag } = encryptEmail(email);

        // Send response to client
        // Provide encrypted email and authentication tag to be stored in local storage
        response.statusCode = 200;
        response.end(
          JSON.stringify({
            exists: true,
            email: encrypted_email,
            auth_tag: tag,
          })
        );

        // If there are database or bcrypt errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST logout request
  } else if (request.method === "POST" && pathname.includes("logout")) {
    try {
      // Convert chunk to string for POST request body
      let body = "";
      request.on("data", (chunk) => {
        body += chunk.toString();
      });

      // Process logout
      request.on("end", async () => {
        const { encrypted_email, auth_tag } = JSON.parse(body); // Get login details from client
        const decrypted_email = decryptEmail(encrypted_email, auth_tag); // Decrypt email

        // Prepare SQL to log user out
        const sql_logout = `
          UPDATE Customers
          SET isLoggedIn = 0
          WHERE Email = ?`;

        // Log user out
        await connection.execute(sql_logout, [decrypted_email]);

        // Send response to client to remove data stored in local storage
        response.statusCode = 200;
        response.end(
          JSON.stringify({
            message: "Logout successful",
            isLoggedIn: false,
          })
        );
      });

      // If there are database or crypto errors
    } catch (error) {
      response.end(JSON.stringify({ error: "Internal server error" }));
    }

    // Route - POST order history request
  } else if (request.method === "POST" && pathname.includes("order-history")) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Extract order history
    request.on("end", async () => {
      try {
        const { encrypted_email, auth_tag } = JSON.parse(body); // Get login details from client
        const decrypted_email = decryptEmail(encrypted_email, auth_tag); // Decrypt email

        // Prepare SQL for extracting order history
        const sql_order_history = `
          SELECT o.OrderDate AS Order_Date, p.ProductName AS Product, od.Quantity AS Quantity, od.UnitPrice AS Unit_Price, o.TotalAmount AS Total_Amount, o.PaymentMethod AS Payment_Method 
          FROM OrderDetails AS od
            JOIN Orders AS o ON o.OrderID = od.OrderID
            JOIN Customers AS c ON c.CustomerID = o.CustomerID
            JOIN Products AS p ON p.ProductID = od.ProductID
          WHERE c.Email = ?
          ORDER BY o.OrderDate DESC`;

        // Extracting order history
        const [rows] = await connection.execute(sql_order_history, [
          decrypted_email,
        ]);

        // Send response to client
        // Provide order history
        response.statusCode = 200;
        response.end(JSON.stringify({ order_history: rows }));

        // If there are database or crypto errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST request to add to cart from shop page
  } else if (request.method === "POST" && pathname.includes("add-to-cart")) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Add product to cart from shop page
    request.on("end", async () => {
      try {
        const { encrypted_email, auth_tag, product_id, quantity } =
          JSON.parse(body); // Get cart details from client
        const decrypted_email = decryptEmail(encrypted_email, auth_tag); // Decrypt email

        // Prepare SQL to check for a specific product in customer's cart
        const sql_check_cart = `
          SELECT *
          FROM CartDetails AS cd
            JOIN Customers AS c ON c.CustomerID = cd.CustomerID
            JOIN Products AS p ON p.ProductID = cd.ProductID
          WHERE c.Email = ?
            AND cd.ProductID = ?`;

        // Check for a specific product in customer's cart
        const [rows] = await connection.execute(sql_check_cart, [
          decrypted_email,
          product_id,
        ]);

        // If the product already exists in cart, update existing product quantity
        if (rows.length > 0) {
          const customer_id = rows[0].CustomerID; // Get CustomerID
          const curr_quantity = rows[0].Quantity; // Get cart quantity

          // Prepare SQL to add to cart with new quantity
          const sql_update_cart = `
            UPDATE CartDetails
            SET Quantity = ?
            WHERE CustomerID = ?
              AND ProductID = ?`;

          // Add to cart with new quantity
          await connection.execute(sql_update_cart, [
            curr_quantity + quantity,
            customer_id,
            product_id,
          ]);

          // Send response to client that addition to cart is successful
          response.statusCode = 200;
          response.end(JSON.stringify({ success: true }));

          // If the product is yet to exist in cart, add to cart as new item
        } else {
          // Prepare SQL to add product to customer's cart
          const sql_add_cart_details = `
            INSERT INTO CartDetails (CustomerID, ProductID, Quantity, UnitPrice)
            SELECT c.CustomerID, p.ProductID, ? AS Quantity, p.Price AS UnitPrice
            FROM Customers AS c
              JOIN Products AS p ON p.ProductID = ?
            WHERE c.Email = ?`;

          // Prepare SQL to add product to customer's cart
          await connection.execute(sql_add_cart_details, [
            quantity,
            product_id,
            decrypted_email,
          ]);

          // Send response to client that addition to cart is successful
          response.statusCode = 200;
          response.end(JSON.stringify({ success: true }));
        }

        // If there are database or crypto errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST cart view request
  } else if (request.method === "POST" && pathname.includes("cart-items")) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Process to view user's cart items
    request.on("end", async () => {
      try {
        const { encrypted_email, auth_tag } = JSON.parse(body); // Get login details from client
        const decrypted_email = decryptEmail(encrypted_email, auth_tag); // Decrypt email

        // Prepare SQL to extract customer's cart
        const sql_see_cart = `
          SELECT cd.ProductID AS Product_ID, p.ProductName AS Product_Name, p.Price AS Price, cd.Quantity AS Quantity, p.StockQuantity AS Stock_Quantity
          FROM CartDetails AS cd
            JOIN Customers AS c ON c.CustomerID = cd.CustomerID
            JOIN Products AS p ON p.ProductID = cd.ProductID
          WHERE c.Email = ?`;

        // Extract customer's cart
        const [rows] = await connection.execute(sql_see_cart, [
          decrypted_email,
        ]);

        // Send response to client that cart retrieval is successful
        response.statusCode = 200;
        response.end(JSON.stringify({ cart_items: rows }));

        // If there are database or crypto errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST update product quantity in cart
  } else if (
    request.method === "POST" &&
    pathname.includes("change-cart-qty")
  ) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Change product quantity in customer's cart
    request.on("end", async () => {
      try {
        const { encrypted_email, auth_tag, product_id, quantity } =
          JSON.parse(body); // Get login details, specific product and desired quantity
        const decrypted_email = decryptEmail(encrypted_email, auth_tag); // Decrypt email

        // Prepare SQL to update product quantity in customer's cart
        const sql_update_cart_qty = `
          UPDATE CartDetails AS cd
          JOIN Customers AS c ON c.CustomerID = cd.CustomerID
          SET cd.Quantity = ?
          WHERE c.Email = ?
            AND cd.ProductID = ?;`;

        // Update product quantity in customer's cart
        await connection.execute(sql_update_cart_qty, [
          quantity,
          decrypted_email,
          product_id,
        ]);

        // Send response to client that product quantity update is successful
        response.statusCode = 200;
        response.end(JSON.stringify({ success: true }));

        // If there are database or crypto errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST remove product from cart request
  } else if (
    request.method === "POST" &&
    pathname.includes("remove-cart-item")
  ) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Process deletion of specific product from customer's cart
    request.on("end", async () => {
      try {
        const { encrypted_email, auth_tag, product_id } = JSON.parse(body); // Get login details and specific product
        const decrypted_email = decryptEmail(encrypted_email, auth_tag); // Decrypt email

        // Prepare SQL to delete product from customer's cart
        const sql_del_cart_details = `
          DELETE FROM CartDetails
          WHERE CustomerID = (
            SELECT CustomerID
            FROM Customers
            WHERE Email = ?
          )
            AND ProductID = ?`;

        // Delete product from customer's cart
        await connection.execute(sql_del_cart_details, [
          decrypted_email,
          product_id,
        ]);

        // Send response to client that product removal is successful
        response.statusCode = 200;
        response.end(JSON.stringify({ success: true }));

        // If there are database or crypto errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST request to reset password
  } else if (request.method === "POST" && pathname.includes("reset-password")) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    request.on("end", async () => {
      try {
        const { email, code, password } = JSON.parse(body); // Get password reset details

        // Prepare SQL to check code against database
        const sql_check_code = `
          SELECT *
          FROM Customers
          WHERE Email = ?
            AND Code = ?`;

        // Check code against database
        const [rows] = await connection.execute(sql_check_code, [email, code]);

        // If there is a match with the provided code and email, reset password
        if (rows.length > 0 && rows[0].Code === code) {
          // Hash password to be stored in database
          const hashedPassword = await bcrypt.hash(password, 10);

          // Prepare SQL to reset password
          const sql_reset_password = `
            UPDATE Customers
            SET HashedPassword = ?,
              Code = NULL
            WHERE Email = ?`;

          // Reset password
          await connection.execute(sql_reset_password, [hashedPassword, email]);

          // Send response to client that password reset is successful
          response.statusCode = 200;
          response.end(JSON.stringify({ success: true }));

          // If there is no match with the code
        } else {
          response.end(JSON.stringify({ success: false }));
        }

        // If there are database or bcrypt errors
      } catch (error) {
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST checkout request
  } else if (request.method === "POST" && pathname.includes("checkout")) {
    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Proceed-to-checkout process
    request.on("end", async () => {
      try {
        const { encrypted_email, auth_tag } = JSON.parse(body); // Get login details
        const decrypted_email = decryptEmail(encrypted_email, auth_tag); // Decrypt email

        is_rollback = false; // Reset rollback tracker to false

        // Enforce fist-come-first-served processing
        await connection.execute(
          "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"
        );

        // Begin transanction
        await connection.beginTransaction();

        // Prepare SQL to lock and search relevant rows for processing
        const sql_lock_query = `
          SELECT *
          FROM Products AS p
            JOIN CartDetails AS cd ON cd.ProductID = p.ProductID
            JOIN Customers AS c ON c.CustomerID = cd.CustomerID
          WHERE c.Email = ?
          FOR UPDATE`;

        // Lock and search relevant rows for processing
        const [rows] = await connection.execute(sql_lock_query, [
          decrypted_email,
        ]);

        // Check for insufficient stock
        var insufficient_stock_list = []; // List of products with stock lower than quantity added to cart
        rows.forEach((row) => {
          // If stock quantity is lower than quantity added to cart
          if (row.StockQuantity < row.Quantity) {
            // Get relevant data about product
            const insufficient_item = {
              ProductID: row.ProductID,
              Stock: row.StockQuantity,
              CartQuantity: row.Quantity,
              UnitPrice: row.Price,
            };
            insufficient_stock_list.push(insufficient_item);
          }
        });

        // If stock is insufficient for customer's cart
        if (insufficient_stock_list.length > 0) {
          await connection.rollback(); // Rollback transaction
          is_rollback = true;

          // Send response to client
          // Send list of products with quantity changes in cart
          response.end(
            JSON.stringify({
              insufficient_stock: true,
              curr_stock: insufficient_stock_list,
            })
          );
          return;
        }

        // If stock is sufficient for customer's cart, continue to start timeout for transaction

        // Prepare SQL to get Customer ID
        const sql_get_CustomerID = `
          SELECT CustomerID
          FROM Customers
          WHERE Email = ?`;

        // Get Customer ID
        const [customer] = await connection.execute(sql_get_CustomerID, [
          decrypted_email,
        ]);
        const customer_id = customer[0].CustomerID;

        // Get transaction expiration time (5 minutes from now)
        const expiration_datetime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        // Prepare SQL to add transaction to timeout table
        const sql_start_timeout = `
          INSERT INTO TransactionTimeouts (CustomerID, ExpirationTime) VALUES
            (?, ?);`;

        // Add transaction to list of timeout table
        await connection.execute(sql_start_timeout, [
          customer_id,
          expiration_datetime,
        ]);

        // Check for expired transactions to rollback every 30 seconds for 5 minutes
        interval_id = setInterval(
          () => checkForExpiredTransactions(decrypted_email, response),
          30 * 1000
        );

        // Send response to client that checkout transaction has started
        // Provide the date and time of transaction expiry
        response.statusCode = 200;
        response.end(
          JSON.stringify({
            message: "Transaction started",
            expirationTime: expiration_datetime,
          })
        );

        // If there are database or crypto errors
      } catch (error) {
        await connection.rollback();
        is_rollback = true;
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - POST submit payment
  } else if (request.method === "POST" && pathname.includes("pay")) {
    // If rollback already completed
    if (is_rollback === true) {
      response.end(JSON.stringify({ success: false }));
      return;
    }

    stopRollbackCheck(); // Stop rollback checks

    // Convert chunk to string for POST request body
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Process payment and commit transaction in database
    request.on("end", async () => {
      try {
        const { encrypted_email, auth_tag, pay, payment_method, cart_items } =
          JSON.parse(body); // Get login details, payment method (and cart items for PDF)
        const decrypted_email = decryptEmail(encrypted_email, auth_tag); // Decrypt email

        // If customer does not want to pay before timeout, rollback
        if (pay === false) {
          await connection.rollback();
          is_rollback = true;
          response.end(JSON.stringify({ success: false }));
          return;
        }

        // If customer wants to pay

        // Prepare SQL to check transaction expiry for customer
        const sql_timeout_check = `
          SELECT tt.ExpirationTime
          FROM TransactionTimeouts AS tt
            JOIN Customers AS c ON c.CustomerID = tt.CustomerID
          WHERE c.Email = ?`;

        // Check transaction expiry for customer
        const [rows] = await connection.execute(sql_timeout_check, [
          decrypted_email,
        ]);

        // If no active transaction found or if transaction has expired (current time exceeds transaction expiry)
        if (
          rows.length === 0 ||
          new Date() > new Date(rows[0].ExpirationTime)
        ) {
          await connection.rollback();
          is_rollback = true;
          response.end(JSON.stringify({ message: "Transaction timed out" }));
          return;
        }

        // If active, valid transaction found, continue payment process

        // Prepare SQL to remove transaction from timeout table
        const sql_stop_timeout = `
          DELETE tt
          FROM TransactionTimeouts AS tt
            JOIN Customers AS c ON c.CustomerID = tt.CustomerID
          WHERE c.Email = ?`;

        // Remove transaction from timeout table
        await connection.execute(sql_stop_timeout, [decrypted_email]);

        // Prepare SQL to update stock
        const update_product_stock = `
          UPDATE Products AS p
            JOIN CartDetails AS cd ON cd.ProductID = p.ProductID
            JOIN Customers AS c ON c.CustomerID = cd.CustomerID
          SET p.StockQuantity = p.StockQuantity - cd.Quantity
          WHERE c.Email = ?`;

        // Update stock
        await connection.execute(update_product_stock, [decrypted_email]);

        // Prepare SQL to create new order
        const sql_new_order = `
          INSERT INTO Orders (CustomerID, OrderDate, TotalAmount, PaymentMethod)
            SELECT c.CustomerID, NOW(), SUM(cd.Quantity * cd.UnitPrice), ?
            FROM CartDetails AS cd
              JOIN Customers AS c ON c.CustomerID = cd.CustomerID
            WHERE c.Email = ?`;

        // Create new order
        const [new_order] = await connection.execute(sql_new_order, [
          payment_method,
          decrypted_email,
        ]);

        // Get ID for new order in Orders table
        const order_id = new_order.insertId;

        // Prepare SQL to create new order details
        const sql_new_orderDetails = `
          INSERT INTO OrderDetails (OrderID, ProductID, Quantity, UnitPrice)
            SELECT ?, cd.ProductID, cd.Quantity, cd.UnitPrice
            FROM CartDetails AS cd
              JOIN Customers AS c ON c.CustomerID = cd.CustomerID
            WHERE c.Email = ?`;

        // Create new order details
        await connection.execute(sql_new_orderDetails, [
          order_id,
          decrypted_email,
        ]);

        // Prepare SQL to empty out customer's cart
        const sql_empty_cart = `
          DELETE FROM CartDetails
          WHERE CustomerID IN (
            SELECT c.CustomerID
            FROM Customers AS c
            WHERE c.Email = ?
          )`;

        // Empty out customer's cart
        await connection.execute(sql_empty_cart, [decrypted_email]);

        // Commit to database
        await connection.commit();

        // Prepare SQL to retrieve customer details
        const sql_customer_details = `
          SELECT *
          FROM Customers AS c
            JOIN Orders AS o ON o.CustomerID = c.CustomerID
          WHERE c.Email = ?
            AND o.OrderID = ?`;

        // Retrieve customer details
        const [customer_order] = await connection.execute(
          sql_customer_details,
          [decrypted_email, order_id]
        );

        // Order confirmation PDF
        const order_confirmation_pdf = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <!-- Bootstrap -->
              <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
                rel="stylesheet"
                integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
                crossorigin="anonymous"
              />
              <script
                src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
                integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
                crossorigin="anonymous"
              ></script>

              <!-- Google Fonts -->
              <link
                href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"
                rel="stylesheet"
              />
              <link
                href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
                rel="stylesheet"
              />
              <title>Order Confirmation</title>
              <style>
                body {
                  font-family: sans-serif;
                  margin: 0;
                  padding: 0;
                  line-height: 1.6;
                }

                .container {
                  width: 80%;
                  margin: 0 auto;
                  padding: 20px;
                }

                h1 {
                  color: #333;
                }

                .address,
                .payment {
                  margin-top: 20px;
                }

                .footer {
                  margin-top: 30px;
                  font-size: 0.9em;
                  color: #666;
                }

                .emoji {
                  font-family: "Noto Color Emoji", sans-serif;
                  font-weight: 400;
                  font-style: normal;
                }

                .brand {
                  font-family: "Nunito", sans-serif;
                  font-optical-sizing: auto;
                  font-weight: 1000;
                  font-style: normal;
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1 class="brand"><span class="emoji">🍡</span> DNGO</h1>

                <h1>Order Confirmation</h1>
                <p>Date: ${customer_order[0].OrderDate}</p>

                <div class="customer-info">
                  <h2>Customer Information</h2>
                  <p><strong>First Name:</strong> ${customer_order[0].FirstName}</p>
                  <p><strong>Last Name:</strong> ${customer_order[0].LastName}</p>
                  <div class="address">
                    <h3>Shipping Address</h3>
                    <p>${customer_order[0].Street}<br />
                      ${customer_order[0].City}<br />
                      ${customer_order[0].Postcode} ${customer_order[0].State}<br />
                      ${customer_order[0].Country}</p>
                  </div>
                </div>

                <div class="order-details">
                  <h2>Order Details</h2>
                  ${cart_items}
                </div>

                <div class="payment">
                  <h2>Payment Method</h2>
                  <p id="payment-method">${payment_method}</p>
                </div>

                <div class="footer">
                  <p>Thank you for your purchase!</p>
                </div>
              </div>
            </body>
          </html>`;

        // Generate Order Confirmation PDF to be emailed
        const file_path = await generatePdf(order_confirmation_pdf);

        // Email body for order confirmation
        const order_confirmation_page = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <link
                href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"
                rel="stylesheet"
              />
              <link
                href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
                rel="stylesheet"
              />

              <style>
                .emoji {
                  font-family: "Noto Color Emoji", sans-serif;
                  font-weight: 400;
                  font-style: normal;
                }

                .brand {
                  font-family: "Nunito", sans-serif;
                  font-optical-sizing: auto;
                  font-weight: 1000;
                  font-style: normal;
                  text-align: center;
                }

                .code {
                  text-align: center;
                  background-color: azure;
                }

                body {
                  font-family: sans-serif;
                }
                #wrapper {
                  width: 60vw;
                  margin: auto;
                }
              </style>
            </head>
            <body>
              <div id="wrapper">
                <h1 class="brand"><span class="emoji">🍡</span> DNGO</h1>
                <br />
                <h3>Order Confirmation</h3>
                <p>
                  Hi, ${customer_order[0].FirstName} ${customer_order[0].LastName}!<br />Your order has
                  been placed. Please find attached the order confirmation as proof of
                  purchase.<br />Thank you for shopping with us!
                </p>
                <br />
                <h4>
                  Team at <span class="brand"><span class="emoji">🍡</span> DNGO</span>
                </h4>
              </div>
            </body>
          </html>`;

        // Email order confirmation with PDF
        sendEmail(
          decrypted_email,
          "DNGO: Thank You For Shopping With Us",
          order_confirmation_page,
          file_path
        );

        // Send response to client that payment has been successful
        response.statusCode = 200;
        response.end(
          JSON.stringify({
            success: true,
          })
        );

        // If there are database or crypto errors
      } catch (error) {
        await connection.rollback();
        is_rollback = true;
        response.end(JSON.stringify({ error: "Internal server error" }));
      }
    });

    // Route - GET all available products
  } else if (request.method === "GET" && pathname.includes("products")) {
    try {
      // Prepare SQL to retrieve all available products
      const sql_products = `
        SELECT *
        FROM Products
        WHERE StockQuantity > 0
        ORDER BY ProductName ASC`;

      // Retrieve all available products
      const [rows] = await connection.execute(sql_products);

      // If no products are available
      if (rows.length === 0) {
        response.end(JSON.stringify({ message: "No products found" }));
        return;
      }

      // If products are available

      // Route - GET selected product and its details (for shop page and product detail page)
      if (pathname.split("/")[4]) {
        const productId = parseInt(pathname.split("/")[4]);

        const selected_product = rows.filter(
          (product) => product.ProductID === productId
        );
        response.end(JSON.stringify(selected_product));
        return;
      }

      // For dropdown filtering process
      // Find product category name
      const categoryName = decodeURIComponent(pathname.split("/")[2]);
      // GET all products for all categories
      if (categoryName === "All Categories") {
        response.end(JSON.stringify(rows));

        // Get all prodcuts for a specific category
      } else {
        const filtered_products = rows.filter(
          (product) => product.Category === categoryName
        );
        response.end(JSON.stringify(filtered_products));
      }

      // If there are database errors
    } catch (error) {
      response.end(JSON.stringify({ error: "Internal server error" }));
    }

    // Query - GET searched products
  } else if (request.method === "GET" && pathname.includes("search")) {
    try {
      // Get search bar query
      const query = url.searchParams;
      const searched_term = query.get("query");

      // Prepare SQL to search available products
      const sql_available_products = `
        SELECT *
        FROM Products
        WHERE StockQuantity > 0
          AND
            (ProductName LIKE ?
            OR Description LIKE ?)
        ORDER BY ProductName ASC`;

      const [rows] = await connection.execute(sql_available_products, [
        `%${searched_term}%`,
        `%${searched_term}%`,
      ]);

      // Send client the data
      response.end(JSON.stringify(rows));

      // If there are database errors
    } catch (error) {
      response.end(JSON.stringify({ error: "Internal server error" }));
    }

    // Route - invalid or unknown routes
  } else {
    // Set response status code to 404 (Not Found)
    response.statusCode = 404;
    response.end("Not Found");
  }
});

// Start the server and listen on port 3000
server.listen(3000);

// Log that the server is running
console.log("Listening on port 3000...");
