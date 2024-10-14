// Global variables
let stock_quantity; // Stock of product
let isLoggedIn; // User login status
let timer_interval; // Timer interval for countdown

window.onload = checkLoginStatus; // Check login status on load

// Checks login status
function checkLoginStatus() {
  // If user info stored
  if (localStorage.getItem("dngo_email")) {
    isLoggedIn = true;
    // If user info not stored
  } else {
    isLoggedIn = false;
  }
}

function loadHome() {
  // Update active section
  document.getElementById("section-featured").style.display = "flex";
  document.getElementById("footer").style.display = "block";
  document.getElementById("section-shop").style.display = "none";
  document.getElementById("section-product").style.display = "none";
  document.getElementById("section-login").style.display = "none";
  document.getElementById("section-register").style.display = "none";
  document.getElementById("section-account").style.display = "none";
  document.getElementById("section-cart").style.display = "none";
  document.getElementById("section-forgot-password").style.display = "none";
  document.getElementById("section-payment").style.display = "none";

  // Update active navigation
  document.getElementById("nav-home").classList.add("active");
  document.getElementById("nav-shop").classList.remove("active");
  document.getElementById("nav-cart").classList.remove("active");
  document.getElementById("nav-account").classList.remove("active");
}

function loadShop() {
  // Update active section
  document.getElementById("section-featured").style.display = "none";
  document.getElementById("footer").style.display = "none";
  document.getElementById("section-shop").style.display = "block";
  document.getElementById("section-product").style.display = "none";
  document.getElementById("section-login").style.display = "none";
  document.getElementById("section-register").style.display = "none";
  document.getElementById("section-account").style.display = "none";
  document.getElementById("section-cart").style.display = "none";
  document.getElementById("section-forgot-password").style.display = "none";
  document.getElementById("section-payment").style.display = "none";

  // Update active navigation
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-shop").classList.add("active");
  document.getElementById("nav-cart").classList.remove("active");
  document.getElementById("nav-account").classList.remove("active");

  fetchProducts("All Categories");
}

async function fetchProducts(category_name) {
  try {
    document.getElementById("btn-category").textContent = category_name;

    const response = await axios.get(
      `http://localhost:3000/api/${encodeURIComponent(category_name)}/products`
    );

    const products = response.data;

    const container = document.getElementById("card-container");
    let cards_html = "";
    var product_category = [];

    products.forEach((row) => {
      cards_html += `
              <div class="col-md-3" onclick="fetchProductDetails('${encodeURIComponent(
                row.Category
              )}', ${row.ProductID})">
                <div class="card text-bg-secondary">
                  <img src="${row.ProductImg}" class="card-img-top" alt="${
        row.ProductName
      }">
                  <div class="card-body">
                    <h5 class="card-title text-center">${row.ProductName}</h5>
                  </div>
                </div>
              </div>`;

      product_category.push(row.Category);
    });

    container.innerHTML = cards_html;

    product_category.push("All Categories");
    const categories = [...new Set(product_category)];

    if (categories.length > 1) {
      // Create dropdown filter
      document.getElementById("category-dropdown").innerHTML = "";
      categories.sort();
      categories.forEach((category) => {
        var new_li = document.createElement("li");
        new_li.textContent = category;
        new_li.onclick = () => fetchProducts(category);
        document.getElementById("category-dropdown").appendChild(new_li);
      });
    }

    // Log any errors to the console
  } catch (error) {
    console.log(error);
  }
}

async function fetchProductDetails(encoded_category_name, product_id) {
  try {
    document.getElementById("section-shop").style.display = "none";
    document.getElementById("section-product").style.display = "block";

    const response = await axios.get(
      `http://localhost:3000/api/${encoded_category_name}/products/${product_id}`
    );

    const product = response.data;

    document.getElementById("img-prod-details").src = product[0].ProductImg;

    document.getElementById("h1-prod-name").textContent =
      product[0].ProductName;

    document.getElementById(
      "h3-prod-price"
    ).textContent = `$${product[0].Price}`;

    document.getElementById("p-prod-message").textContent = "";

    document.getElementById("p-prod-details").textContent =
      product[0].Description;

    document.getElementById("add-to-cart-btn").onclick = () => {
      addToCart(product_id);
    };

    // Reset decrease button
    document.getElementById("quantity").textContent = "1";
    document.getElementById("btn-decrease").disabled = true;
    document
      .getElementById("btn-decrease")
      .classList.toggle("btn-outline-secondary", true);
    document
      .getElementById("btn-decrease")
      .classList.toggle("btn-outline-info", false);

    stock_quantity = product[0].StockQuantity;
  } catch (error) {
    console.log(error);
  }
}

// Changes the quantity of product
function updateQuantity(adjustment) {
  document.getElementById("p-prod-message").textContent = "";

  const quantity_el = document.getElementById("quantity");
  let curr_quantity = parseInt(quantity_el.textContent);

  const new_quantity = curr_quantity + adjustment;

  // Check if new quantity is within bounds
  if (new_quantity >= 1 && new_quantity <= stock_quantity) {
    quantity_el.textContent = new_quantity;

    // Update button states
    document.getElementById("btn-decrease").disabled = new_quantity === 1;
    document.getElementById("btn-increase").disabled =
      new_quantity === stock_quantity;

    // Update button styles
    document
      .getElementById("btn-decrease")
      .classList.toggle("btn-outline-secondary", new_quantity === 1);
    document
      .getElementById("btn-decrease")
      .classList.toggle("btn-outline-info", new_quantity > 1);
    document
      .getElementById("btn-increase")
      .classList.toggle(
        "btn-outline-secondary",
        new_quantity === stock_quantity
      );
    document
      .getElementById("btn-increase")
      .classList.toggle("btn-outline-info", new_quantity < stock_quantity);
  }
}

async function addToCart(product_id) {
  // If logged in, add to cart
  if (isLoggedIn) {
    const quantity_el = document.getElementById("quantity");
    const curr_quantity = parseInt(quantity_el.textContent);

    const email = localStorage.getItem("dngo_email");
    const tag = localStorage.getItem("dngo_auth_tag");

    try {
      const response = await axios.post("http://localhost:3000/add-to-cart", {
        encrypted_email: email,
        auth_tag: tag,
        product_id: product_id,
        quantity: curr_quantity,
      });

      if (response.data.success) {
        document.getElementById("p-prod-message").textContent =
          "Successfully added to cart";
      }
    } catch (error) {
      console.error("Error adding to cart: ", error);
    }
    // Go to login page
  } else {
    loadLoginPage();
  }
}

function loadLoginPage() {
  // Update active navigation
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-shop").classList.remove("active");
  document.getElementById("nav-cart").classList.remove("active");
  document.getElementById("nav-account").classList.add("active");

  if (isLoggedIn) {
    loadAcctPage();
  } else {
    // Update active section
    document.getElementById("section-featured").style.display = "none";
    document.getElementById("footer").style.display = "none";
    document.getElementById("section-shop").style.display = "none";
    document.getElementById("section-product").style.display = "none";
    document.getElementById("section-login").style.display = "block";
    document.getElementById("section-register").style.display = "none";
    document.getElementById("section-account").style.display = "none";
    document.getElementById("section-cart").style.display = "none";
    document.getElementById("section-forgot-password").style.display = "none";
    document.getElementById("section-payment").style.display = "none";

    clearLogin();
  }
}

async function login() {
  const email = document.getElementById("inp-login-email").value.trim();
  const password = document.getElementById("inp-login-password").value.trim();

  try {
    const response = await axios.post("http://localhost:3000/login", {
      email,
      password,
    });

    // Check if the response is successful
    document.getElementById("p-login-message").textContent =
      response.data.message;

    if (response.data.exists) {
      isLoggedIn = response.data.exists;
      localStorage.setItem("dngo_email", response.data.email);
      localStorage.setItem("dngo_auth_tag", response.data.auth_tag);

      clearLogin();
      loadAcctPage();
    }
  } catch (error) {
    if (error.response) {
      // Server responded with a status other than 2xx
      document.getElementById("p-login-message").textContent =
        error.response.data.error;
    } else {
      // Network error or no response
      console.error("Error:", error);
      document.getElementById("p-login-message").textContent =
        "An error occurred";
    }
  }
}

function loadRegisterPage() {
  // Update active section
  document.getElementById("section-featured").style.display = "none";
  document.getElementById("footer").style.display = "none";
  document.getElementById("section-shop").style.display = "none";
  document.getElementById("section-product").style.display = "none";
  document.getElementById("section-login").style.display = "none";
  document.getElementById("section-register").style.display = "block";
  document.getElementById("section-account").style.display = "none";
  document.getElementById("section-cart").style.display = "none";
  document.getElementById("section-forgot-password").style.display = "none";
  document.getElementById("section-payment").style.display = "none";

  // Update active navigation
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-shop").classList.remove("active");
  document.getElementById("nav-cart").classList.remove("active");
  document.getElementById("nav-account").classList.add("active");

  clearRegisterErrors();
  clearRegister();
}

function clearLogin() {
  const login_els = document.querySelectorAll('[id^="inp-login-"]');
  if (login_els.length > 0) {
    login_els.forEach((input) => {
      if (input.tagName === "INPUT") {
        input.value = "";
      }
    });
  }
  document.getElementById("p-login-message").textContent = "";
}

function clearRegisterErrors() {
  const err_msg_els = document.querySelectorAll(".register-errors");
  if (err_msg_els.length > 0) {
    err_msg_els.forEach((p) => (p.textContent = ""));
  }

  const invalid_input_els = document.querySelectorAll(".invalid-inputs");
  if (invalid_input_els.length > 0) {
    invalid_input_els.forEach((input) =>
      input.classList.toggle("invalid-inputs", false)
    );
  }
}

function clearRegister() {
  const register_els = document.querySelectorAll('[id^="inp-register-"]');
  if (register_els.length > 0) {
    register_els.forEach((input) => {
      if (input.tagName === "INPUT") {
        input.value = "";
      } else {
        input.selectedIndex = -1;
      }
    });
  }
  document.getElementById("p-register-message").textContent = "";
}

class RegistrationFormValidator {
  #firstName;
  #lastName;
  #email;
  #password;
  #phone;
  #street;
  #city;
  #state;
  #postcode;
  #country;

  #is_valid;

  constructor() {
    this.#is_valid = true;
  }

  #showError(element_id, message) {
    document
      .getElementById(element_id)
      .classList.toggle("invalid-inputs", true);
    if (document.getElementById(element_id).tagName === "INPUT") {
      document.getElementById(element_id).value = "";
    }
    document.getElementById(`p-${element_id.slice(4)}`).textContent = message;
  }

  #validateFirstName() {
    if (this.#firstName.length < 3 || this.#firstName.length > 50) {
      this.#showError(
        "inp-register-fname",
        "First name must be between 3 and 50 characters."
      );
      this.#is_valid = false;
    }
  }

  #validateLastName() {
    if (this.#lastName.length < 3 || this.#lastName.length > 50) {
      this.#showError(
        "inp-register-lname",
        "Last name must be between 3 and 50 characters."
      );
      this.#is_valid = false;
    }
  }

  async #validateEmail() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(this.#email)) {
      this.#showError(
        "inp-register-email",
        "Email must be valid and contain no spaces."
      );
      this.#is_valid = false;
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/validate-email",
        { email: this.#email }
      );
      const email_exists = response.data.exists;

      if (email_exists) {
        this.#showError("inp-register-email", "Email is already registered.");
        this.#is_valid = false;
      }
    } catch (error) {
      console.error("Error checking email on server: ", error);
      this.#showError(
        "inp-register-email",
        "Server error while checking email."
      );
      this.#is_valid = false;
    }
  }

  #validatePassword() {
    if (this.#password.length < 8 || this.#password.length > 20) {
      this.#showError(
        "inp-register-password",
        "Password must be between 8 and 20 characters."
      );
      this.#is_valid = false;
    }
  }

  #validatePhone() {
    const phonePattern = /^\d{5,20}$/;

    // Check if the phone number contains only digits and is of appropriate length
    if (this.#phone.length < 5 || this.#phone.length > 20) {
      this.#showError(
        "inp-register-phone",
        "Phone number must be between 5 and 20 digits long."
      );
      this.#is_valid = false;
    } else if (!phonePattern.test(this.#phone)) {
      this.#showError(
        "inp-register-phone",
        "Phone number must contain numerical values only."
      );
      this.#is_valid = false;
    }
  }

  #validateStreet() {
    if (this.#street.length < 5 || this.#street.length > 255) {
      this.#showError(
        "inp-register-street",
        "Street must be between 5 and 255 characters."
      );
      this.#is_valid = false;
    }
  }

  #validateCity() {
    if (this.#city.length < 2 || this.#city.length > 50) {
      this.#showError(
        "inp-register-city",
        "City must be between 2 and 50 characters."
      );
      this.#is_valid = false;
    }
  }

  #validateState() {
    if (this.#state.length < 2 || this.#state.length > 50) {
      this.#showError(
        "inp-register-state",
        "State must be between 2 and 50 characters."
      );
      this.#is_valid = false;
    }
  }

  #validatePostcode() {
    if (this.#postcode.length < 2 || this.#postcode.length > 20) {
      this.#showError(
        "inp-register-postcode",
        "Postcode must be between 2 and 20 characters."
      );
      this.#is_valid = false;
    }
  }

  #validateCountry() {
    if (this.#country === "") {
      this.#showError("inp-register-country", "Country must be selected.");
      this.#is_valid = false;
    }
  }

  async validate() {
    this.#is_valid = true;
    clearRegisterErrors();

    this.#firstName = document
      .getElementById("inp-register-fname")
      .value.trim();
    this.#lastName = document.getElementById("inp-register-lname").value.trim();
    this.#email = document.getElementById("inp-register-email").value.trim();
    this.#password = document
      .getElementById("inp-register-password")
      .value.trim();
    this.#phone = document.getElementById("inp-register-phone").value.trim();
    this.#street = document.getElementById("inp-register-street").value.trim();
    this.#city = document.getElementById("inp-register-city").value.trim();
    this.#state = document.getElementById("inp-register-state").value.trim();
    this.#postcode = document
      .getElementById("inp-register-postcode")
      .value.trim();
    this.#country = document.getElementById("inp-register-country").value;

    this.#validateFirstName();
    this.#validateLastName();
    await this.#validateEmail();
    this.#validatePassword();
    this.#validatePhone();
    this.#validateStreet();
    this.#validateCity();
    this.#validateState();
    this.#validatePostcode();
    this.#validateCountry();

    return this.#is_valid;
  }
}

async function register(event) {
  try {
    event.preventDefault();
    const validator = new RegistrationFormValidator();

    const is_valid = await validator.validate();

    if (is_valid) {
      document.getElementById("p-register-message").textContent =
        "Registration successful!";

      const fname = document.getElementById("inp-register-fname").value.trim();
      const lname = document.getElementById("inp-register-lname").value.trim();
      const email = document.getElementById("inp-register-email").value.trim();
      const password = document
        .getElementById("inp-register-password")
        .value.trim();
      const phone = document.getElementById("inp-register-phone").value.trim();
      const street = document
        .getElementById("inp-register-street")
        .value.trim();
      const city = document.getElementById("inp-register-city").value.trim();
      const state = document.getElementById("inp-register-state").value.trim();
      const postcode = document
        .getElementById("inp-register-postcode")
        .value.trim();
      const country = document.getElementById("inp-register-country").value;

      const response = await axios.post("http://localhost:3000/register", {
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
      });

      if (response.data.exists) {
        isLoggedIn = response.data.exists;
        localStorage.setItem("dngo_email", response.data.email);
        localStorage.setItem("dngo_auth_tag", response.data.auth_tag);

        clearRegister();

        loadAcctPage();
      }

      // Print error message
    } else {
      document.getElementById("p-register-message").textContent =
        "Please correct the errors in the form.";
    }
  } catch (error) {
    console.error("Error registering: ", error);
  }
}

function loadAcctPage() {
  // Update active section
  document.getElementById("section-featured").style.display = "none";
  document.getElementById("footer").style.display = "none";
  document.getElementById("section-shop").style.display = "none";
  document.getElementById("section-product").style.display = "none";
  document.getElementById("section-login").style.display = "none";
  document.getElementById("section-register").style.display = "none";
  document.getElementById("section-account").style.display = "block";
  document.getElementById("section-cart").style.display = "none";
  document.getElementById("section-forgot-password").style.display = "none";
  document.getElementById("section-payment").style.display = "none";

  // Update active navigation
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-shop").classList.remove("active");
  document.getElementById("nav-cart").classList.remove("active");
  document.getElementById("nav-account").classList.add("active");

  fetchOrderHistory();
}

// Removes errors when there is typing
function removeError(input_id, p_err_id) {
  document.getElementById(input_id).classList.toggle("invalid-inputs", false);
  document.getElementById(p_err_id).textContent = "";
}

async function logout() {
  try {
    const email = localStorage.getItem("dngo_email");
    const tag = localStorage.getItem("dngo_auth_tag");

    const response = await axios.post("http://localhost:3000/logout", {
      encrypted_email: email,
      auth_tag: tag,
    });

    if (response.data.isLoggedIn !== null) {
      isLoggedIn = response.data.isLoggedIn;
      localStorage.removeItem("dngo_email");
      localStorage.removeItem("dngo_auth_tag");
      loadHome();
    }
  } catch (error) {
    console.error("Error logging out: ", error);
  }
}

async function fetchOrderHistory() {
  try {
    const email = localStorage.getItem("dngo_email");
    const tag = localStorage.getItem("dngo_auth_tag");

    const response = await axios.post("http://localhost:3000/order-history", {
      encrypted_email: email,
      auth_tag: tag,
    });

    generateOrdersTable(response.data.order_history);
  } catch (error) {
    console.error("Error fetching order history: ", error);
  }
}

function generateOrdersTable(json_data) {
  if (json_data !== null) {
    document.getElementById("table-orders").style.display = "block";
    document.getElementById("p-orders-message").textContent = "";

    const table_body_el = document.getElementById("tbody-orders");
    table_body_el.innerHTML = "";

    // Create list of order details according to order date
    const grouped_data = json_data.reduce((acc, item) => {
      const isoString = new Date(item.Order_Date);

      const order_date = isoString.toLocaleString("en-US", {
        weekday: "long", // e.g., "Monday"
        year: "numeric", // e.g., "2024"
        month: "long", // e.g., "September"
        day: "numeric", // e.g., "7"
        hour: "2-digit", // e.g., "04 PM"
        minute: "2-digit", // e.g., "30"
      });

      if (!acc[order_date]) {
        acc[order_date] = [];
      }

      acc[order_date].push(item);
      return acc;
    }, {});

    for (const [Order_Date, items] of Object.entries(grouped_data)) {
      const firstItem = items[0];

      const row = document.createElement("tr");
      row.innerHTML = `
        <td rowspan="${items.length}">${Order_Date}</td>
        <td>${firstItem.Product}</td>
        <td  class="text-end">${firstItem.Quantity}</td>
        <td class="text-end">$${firstItem.Unit_Price}</td>
        <td class="text-end" rowspan="${items.length}">$${firstItem.Total_Amount}</td>
        <td rowspan="${items.length}">${firstItem.Payment_Method}</td>`;
      table_body_el.appendChild(row);

      for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.Product}</td>
          <td class="text-end">${item.Quantity}</td>
          <td class="text-end">$${item.Unit_Price}</td>`;
        table_body_el.appendChild(row);
      }
    }
  } else {
    document.getElementById("table-orders").style.display = "none";
    document.getElementById("p-orders-message").textContent =
      "No orders made. Place an order to see order history.";
  }
}

function loadCartPage() {
  // Update active section
  document.getElementById("section-featured").style.display = "none";
  document.getElementById("footer").style.display = "none";
  document.getElementById("section-shop").style.display = "none";
  document.getElementById("section-product").style.display = "none";
  document.getElementById("section-login").style.display = "none";
  document.getElementById("section-register").style.display = "none";
  document.getElementById("section-account").style.display = "none";
  document.getElementById("section-cart").style.display = "block";
  document.getElementById("section-forgot-password").style.display = "none";
  document.getElementById("section-payment").style.display = "none";

  // Update active navigation
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-shop").classList.remove("active");
  document.getElementById("nav-cart").classList.add("active");
  document.getElementById("nav-account").classList.remove("active");

  // Reset cart table
  document.getElementById("table-cart").style.display = "none";
  document.getElementById("tbody-cart").innerHTML = "";

  if (isLoggedIn) {
    document.getElementById("p-cart-message").textContent = "";
    document.getElementById("td-total-amount").textContent = "";

    fetchCartItems();
  } else {
    document.getElementById("btn-checkout").style.display = "none";
    document.getElementById("p-cart-message").textContent =
      "Empty! Add a product to see it in the cart!";
  }
}

async function fetchCartItems() {
  try {
    const email = localStorage.getItem("dngo_email");
    const tag = localStorage.getItem("dngo_auth_tag");

    const response = await axios.post("http://localhost:3000/cart-items", {
      encrypted_email: email,
      auth_tag: tag,
    });

    if (response.data.cart_items.length < 1) {
      document.getElementById("btn-checkout").style.display = "none";
      document.getElementById("p-cart-message").textContent =
        "Empty! Add a product to see it in the cart!";
    } else {
      document.getElementById("btn-checkout").style.display = "block";
      generateCartTable(response.data.cart_items);
    }
  } catch (error) {
    console.error("Error fetching order history: ", error);
  }
}

function generateCartTable(json_data) {
  if (json_data.length > 0) {
    document.getElementById("table-cart").style.display = "block";
    document.getElementById("p-cart-message").textContent = "";
    document.getElementById("td-total-amount").textContent = "";

    const table_body_el = document.getElementById("tbody-cart");
    table_body_el.innerHTML = "";

    var total_amount = 0;

    json_data.forEach((product) => {
      const row = document.createElement("tr");
      row.id = `tr-cart-${product.Product_ID}`;
      row.innerHTML = `
        <td>${product.Product_Name}</td>
        
        <td class="text-end">
          <button id="btn-decrease-${product.Product_ID}"
            class="btn"
            onclick="updateCartQty(-1,
                ${product.Product_ID},
                ${product.Stock_Quantity},
                ${product.Price})
            ">-</button>
          <span id="td-cart-${product.Product_ID}">${product.Quantity}</span>
          <button id="btn-increase-${product.Product_ID}"
            class="btn"
            onclick="updateCartQty(1,
              ${product.Product_ID},
              ${product.Stock_Quantity},
              ${product.Price})
          ">+</button>
        </td>
        
        <td class="text-end">$${product.Price}</td>
        
        <td id="td-cart-price-${product.Product_ID}" class="text-end">
          $${(product.Quantity * product.Price).toFixed(2)}
        </td>

        <td>
          <button onclick="removeCartItem(
            ${product.Product_ID},
            ${product.Price}
          )">Remove</button>
        </td>`;

      total_amount += product.Price * product.Quantity;
      table_body_el.appendChild(row);

      if (product.Quantity === 1) {
        document
          .getElementById(`btn-decrease-${product.Product_ID}`)
          .classList.add("btn-outline-secondary");
        document
          .getElementById(`btn-decrease-${product.Product_ID}`)
          .classList.remove("btn-outline-info");
        document.getElementById(
          `btn-decrease-${product.Product_ID}`
        ).disabled = true;
      } else {
        document
          .getElementById(`btn-decrease-${product.Product_ID}`)
          .classList.remove("btn-outline-secondary");
        document
          .getElementById(`btn-decrease-${product.Product_ID}`)
          .classList.add("btn-outline-info");
        document.getElementById(
          `btn-decrease-${product.Product_ID}`
        ).disabled = false;
      }

      if (product.Quantity === product.Stock_Quantity) {
        document
          .getElementById(`btn-increase-${product.Product_ID}`)
          .classList.add("btn-outline-secondary");
        document
          .getElementById(`btn-increase-${product.Product_ID}`)
          .classList.remove("btn-outline-info");
        document.getElementById(
          `btn-increase-${product.Product_ID}`
        ).disabled = true;
      } else {
        document
          .getElementById(`btn-increase-${product.Product_ID}`)
          .classList.remove("btn-outline-secondary");
        document
          .getElementById(`btn-increase-${product.Product_ID}`)
          .classList.add("btn-outline-info");
        document.getElementById(
          `btn-increase-${product.Product_ID}`
        ).disabled = false;
      }
    });

    document.getElementById(
      "td-total-amount"
    ).textContent = `$${total_amount.toFixed(2)}`;
  }
}

function updateCartQty(adjustment, product_id, product_stock, product_price) {
  const quantity_el = document.getElementById(`td-cart-${product_id}`);
  let curr_quantity = parseInt(quantity_el.textContent);

  const new_quantity = curr_quantity + adjustment;

  // Check if new quantity is within bounds
  if (new_quantity >= 1 && new_quantity <= product_stock) {
    quantity_el.textContent = new_quantity;

    // Update button states
    document.getElementById(`btn-decrease-${product_id}`).disabled =
      new_quantity === 1;
    document.getElementById(`btn-increase-${product_id}`).disabled =
      new_quantity === product_stock;

    // Update button styles
    document
      .getElementById(`btn-decrease-${product_id}`)
      .classList.toggle("btn-outline-secondary", new_quantity === 1);
    document
      .getElementById(`btn-decrease-${product_id}`)
      .classList.toggle("btn-outline-info", new_quantity > 1);
    document
      .getElementById(`btn-increase-${product_id}`)
      .classList.toggle(
        "btn-outline-secondary",
        new_quantity === product_stock
      );
    document
      .getElementById(`btn-increase-${product_id}`)
      .classList.toggle("btn-outline-info", new_quantity < product_stock);

    updateCartDb(product_id, curr_quantity, new_quantity, product_price);
  }
}

async function updateCartDb(
  product_id,
  curr_quantity,
  new_quantity,
  product_price
) {
  try {
    const email = localStorage.getItem("dngo_email");
    const tag = localStorage.getItem("dngo_auth_tag");

    const response = await axios.post("http://localhost:3000/change-cart-qty", {
      encrypted_email: email,
      auth_tag: tag,
      product_id: product_id,
      quantity: new_quantity,
    });

    if (response.data.success) {
      updateItemTotal(product_id, curr_quantity, new_quantity, product_price);
    }
  } catch (error) {
    console.error("Error changing cart quantity: ", error);
  }
}

function updateItemTotal(
  product_id,
  old_quantity,
  new_quantity,
  product_price
) {
  // Update the price for the item
  const price_el = document.getElementById(`td-cart-price-${product_id}`);
  const new_total_price = new_quantity * product_price;
  const old_total_price = old_quantity * product_price;
  price_el.textContent = `$${new_total_price.toFixed(2)}`;

  // Calculate the new grand total
  const total_amount_el = document.getElementById("td-total-amount");
  const curr_grand_total = parseFloat(total_amount_el.textContent.slice(1));
  const new_grand_total = curr_grand_total - old_total_price + new_total_price;
  total_amount_el.textContent = `$${new_grand_total.toFixed(2)}`;
}

async function removeCartItem(product_id, unit_price) {
  try {
    const email = localStorage.getItem("dngo_email");
    const tag = localStorage.getItem("dngo_auth_tag");

    const response = await axios.post(
      "http://localhost:3000/remove-cart-item",
      {
        encrypted_email: email,
        auth_tag: tag,
        product_id: product_id,
      }
    );

    if (response.data.success) {
      const quantity = parseInt(
        document.getElementById(`td-cart-${product_id}`).textContent
      );
      updateItemTotal(product_id, quantity, 0, unit_price);
      document.getElementById(`tr-cart-${product_id}`).remove();

      if (document.getElementById("td-total-amount").textContent === "$0.00") {
        document.getElementById("p-cart-message").textContent =
          "Empty! Add a product to see it in the cart!";
        document.getElementById("table-cart").style.display = "none";
        document.getElementById("btn-checkout").style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error changing cart quantity: ", error);
  }
}

async function searchProducts(event) {
  event.preventDefault();

  const query = document.getElementById("inp-searchbar").value.trim();

  if (query === "") {
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append("query", query);

    const response = await axios.get(
      `http://localhost:3000/search?${params.toString()}`
    );

    const products = response.data;
    const container = document.getElementById("card-container");

    if (products.length > 1) {
      document.getElementById("p-shop-message").innerHTML = "";

      let cards_html = "";
      var product_category = [];

      products.forEach((row) => {
        cards_html += `
              <div class="col-md-3" onclick="fetchProductDetails('${encodeURIComponent(
                row.Category
              )}', ${row.ProductID})">
                <div class="card text-bg-secondary">
                  <img src="${row.ProductImg}" class="card-img-top" alt="${
          row.ProductName
        }">
                  <div class="card-body">
                    <h5 class="card-title text-center">${row.ProductName}</h5>
                  </div>
                </div>
              </div>`;
        product_category.push(row.Category);
      });

      container.innerHTML = cards_html;

      product_category.push("All Categories");
      const categories = [...new Set(product_category)];

      if (categories.length > 1) {
        // Create dropdown filter
        document.getElementById("category-dropdown").innerHTML = "";
        categories.sort();
        categories.forEach((category) => {
          var new_li = document.createElement("li");
          new_li.textContent = category;
          new_li.onclick = () => fetchProducts(category);
          document.getElementById("category-dropdown").appendChild(new_li);
        });
      }

      // No products found based on search
    } else {
      container.innerHTML = "";
      document.getElementById("p-shop-message").innerHTML =
        "No Products Found!";
    }

    // loadShop() without fetching all products
    // Update active section
    document.getElementById("section-featured").style.display = "none";
    document.getElementById("footer").style.display = "none";
    document.getElementById("section-shop").style.display = "block";
    document.getElementById("section-product").style.display = "none";
    document.getElementById("section-login").style.display = "none";
    document.getElementById("section-register").style.display = "none";
    document.getElementById("section-account").style.display = "none";
    document.getElementById("section-cart").style.display = "none";
    document.getElementById("section-forgot-password").style.display = "none";
    document.getElementById("section-payment").style.display = "none";

    // Update active navigation
    document.getElementById("nav-home").classList.remove("active");
    document.getElementById("nav-shop").classList.add("active");
    document.getElementById("nav-cart").classList.remove("active");
    document.getElementById("nav-account").classList.remove("active");

    document.getElementById("inp-searchbar").value = ""; // Clear search bar
  } catch (error) {
    console.error("Error searching products: ", error);
  }
}

function loadResetPage() {
  // Update active section
  document.getElementById("section-featured").style.display = "none";
  document.getElementById("footer").style.display = "none";
  document.getElementById("section-shop").style.display = "none";
  document.getElementById("section-product").style.display = "none";
  document.getElementById("section-login").style.display = "none";
  document.getElementById("section-register").style.display = "none";
  document.getElementById("section-account").style.display = "none";
  document.getElementById("section-cart").style.display = "none";
  document.getElementById("section-forgot-password").style.display = "block";
  document.getElementById("section-payment").style.display = "none";

  // Update active navigation
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-shop").classList.remove("active");
  document.getElementById("nav-cart").classList.remove("active");
  document.getElementById("nav-account").classList.add("active");

  // Make sure correct div gets loaded
  document.getElementById("forgot-container").style.display = "block";
  document.getElementById("reset-container").style.display = "none";
}

async function sendCode() {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      document.getElementById("inp-pw-reset-email").value.trim()
    )
  ) {
    document
      .getElementById("inp-pw-reset-email")
      .classList.toggle("invalid-inputs", true);
    document.getElementById("p-pw-reset-email").innerHTML =
      "Email must be valid and contain no spaces.";
    return;
  }

  try {
    const email = document.getElementById("inp-pw-reset-email").value.trim();
    const response = await axios.post("http://localhost:3000/send-code", {
      email: email,
    });

    if (response.data.exists) {
      document.getElementById("forgot-container").style.display = "none";
      document.getElementById("reset-container").style.display = "block";
    }
  } catch (error) {
    console.error("Error sending code: ", error);
  }
}

async function resetPassword() {
  const password = document
    .getElementById("inp-pw-reset-password")
    .value.trim();

  if (password.length < 8 || password.length > 20) {
    document
      .getElementById("inp-pw-reset-password")
      .classList.toggle("invalid-inputs", true);
    document.getElementById("p-pw-reset-password").innerHTML =
      "New password must be between 8 and 20 characters.";
    return;
  }

  try {
    const email = document.getElementById("inp-pw-reset-email").value.trim();
    const code = document.getElementById("inp-pw-reset-code").value.trim();
    const response = await axios.post("http://localhost:3000/reset-password", {
      email: email,
      code: code,
      password: password,
    });

    if (response.data.success) {
      document.getElementById("inp-pw-reset-email").value = "";
      document.getElementById("inp-pw-reset-code").value = "";
      document.getElementById("inp-pw-reset-password").value = "";
      document.getElementById("reset-container").style.display = "none";
      document.getElementById("forgot-container").style.display = "block";
      document.getElementById("p-reset-message").textContent = "";
      loadLoginPage();
    } else {
      document.getElementById("p-reset-message").textContent = "Reset Failed";
    }
  } catch (error) {
    console.error("Error resetting password: ", error);
  }
}

async function checkout() {
  document.getElementById("p-cart-message").textContent = ""; // Reset message

  try {
    const email = localStorage.getItem("dngo_email");
    const tag = localStorage.getItem("dngo_auth_tag");

    const response = await axios.post("http://localhost:3000/checkout", {
      encrypted_email: email,
      auth_tag: tag,
    });

    // If stock is lower than cart quantity
    if (response.data.insufficient_stock) {
      // Notify user
      document.getElementById(
        "p-cart-message"
      ).textContent = `Your cart has been updated. Click the "Checkout" button again if you wish to proceed.`;

      // Update Cart
      const curr_stock = response.data.curr_stock;

      curr_stock.forEach((item) => {
        // If no stock
        if (item.Stock === 0) {
          removeCartItem(item.ProductID, item.UnitPrice); // Remove Cart item

          // If stock is lower than cart quantity
        } else {
          document.getElementById(`td-cart-${item.ProductID}`).textContent =
            item.Stock; // Update cart item quantity to max available

          // Get item button elements
          const decrease_item_btn = document.getElementById(
            `btn-decrease-${item.ProductID}`
          );
          const increase_item_btn = document.getElementById(
            `btn-increase-${item.ProductID}`
          );

          // Update onclick functions
          decrease_item_btn.onclick = () =>
            updateCartQty(-1, item.ProductID, item.Stock, item.UnitPrice);
          increase_item_btn.onclick = () =>
            updateCartQty(1, item.ProductID, item.Stock, item.UnitPrice);

          // Update increase button disabled attribute
          increase_item_btn.disabled = true;
          increase_item_btn.classList.toggle("btn-outline-info", false);
          increase_item_btn.classList.toggle("btn-outline-secondary", true);

          // If stock only has 1 left, update decrease button disabled attribute
          if (item.Stock == 1) {
            decrease_item_btn.disabled = true;
            decrease_item_btn.classList.toggle("btn-outline-info", false);
            decrease_item_btn.classList.toggle("btn-outline-secondary", true);
          }

          // Update database and Cart table
          updateCartDb(
            item.ProductID,
            item.CartQuantity,
            item.Stock,
            item.UnitPrice
          );
        }
      });
      return;
    }

    // If stock is sufficient
    // Reset page
    document.getElementById("countdown").innerHTML = "";
    document.getElementById("btn-pay").disabled = false;
    document.getElementById("btn-cancel-payment").disabled = false;
    startCountdown(response.data.expirationTime);
    loadPaymentPage();
  } catch (error) {
    console.error("Error processing checkout: ", error);
  }
}

function loadPaymentPage() {
  // Update active section
  document.getElementById("section-featured").style.display = "none";
  document.getElementById("footer").style.display = "none";
  document.getElementById("section-shop").style.display = "none";
  document.getElementById("section-product").style.display = "none";
  document.getElementById("section-login").style.display = "none";
  document.getElementById("section-register").style.display = "none";
  document.getElementById("section-account").style.display = "none";
  document.getElementById("section-cart").style.display = "none";
  document.getElementById("section-forgot-password").style.display = "none";
  document.getElementById("section-payment").style.display = "block";

  // Update active navigation
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-shop").classList.remove("active");
  document.getElementById("nav-cart").classList.add("active");
  document.getElementById("nav-account").classList.remove("active");

  // Prevent user from leaving payment page
  const nav_item_els = document.getElementsByClassName("nav-item");
  for (let i = 0; i < nav_item_els.length; i++) {
    nav_item_els[i].classList.toggle("disabled-navbar-links", true); // Add disabled feature to navigation buttons
    nav_item_els[i].style.display = "none"; // Hide navigation buttons
  }
  // Hide search bar
  document.getElementById("inp-searchbar").style.display = "none";
  document.getElementById("btn-searchbar").style.display = "none";
}

// Starts countdown for transaction timeout
function startCountdown(expiry) {
  // Convert the expiry time to a Date object
  const expiry_date = new Date(expiry);

  // Format the expiration date and time for display
  const expiration = expiry_date.toLocaleString("en-US", {
    weekday: "long", // e.g., "Monday"
    year: "numeric", // e.g., "2024"
    month: "long", // e.g., "September"
    day: "numeric", // e.g., "7"
    hour: "2-digit", // e.g., "04 PM"
    minute: "2-digit", // e.g., "30"
  });

  // Get the HTML element where the countdown will be displayed
  const timer_el = document.getElementById("countdown");

  // Calculate total seconds for the countdown
  function calculateTotalSeconds() {
    const now = new Date();
    const timeLeft = expiry_date - now;
    // Ensure the time left is not below 0
    return Math.max(0, Math.floor(timeLeft / 1000)); // Convert milliseconds to seconds
  }

  // Updates the timer element on the page
  function updateTimer() {
    const total_seconds = calculateTotalSeconds(); // Use the dynamic calculation

    // Calculate minutes and seconds left
    const min_left = Math.floor(total_seconds / 60);
    const sec_left = total_seconds % 60;

    // Update the inner HTML of the countdown element
    timer_el.innerHTML = `Due by ${expiration}<br />${String(min_left).padStart(
      2,
      "0"
    )} minutes ${String(sec_left).padStart(2, "0")} seconds`;

    // Check if the countdown is finished
    if (total_seconds <= 0) {
      // Stop the countdown timer and display "Returning to Cart..."
      clearInterval(timer_interval);
      timer_el.innerHTML = `Returning to Cart...`;
      pay(false);
    }
  }

  // Update the timer immediately and then every second
  updateTimer(); // Initial call to show the countdown immediately
  timer_interval = setInterval(updateTimer, 1000); // Update every second
}

async function pay(confirm) {
  document.getElementById("p-payment").textContent = "";

  if (confirm === true) {
    if (document.getElementById("inp-payment").value === "") {
      document.getElementById("p-payment").textContent =
        "Payment method must be selected.";
      document
        .getElementById("inp-payment")
        .classList.toggle("invalid-inputs", true);

      return;
    }
  }

  try {
    const email = localStorage.getItem("dngo_email");
    const tag = localStorage.getItem("dngo_auth_tag");
    const payment_method = document.getElementById("inp-payment").value;

    var cart_str = document.querySelector("#table-cart").outerHTML;
    cart_str = cart_str.replace(/<button[^>]*>.*?<\/button>/g, ""); // Regex to remove all buttons
    cart_str = cart_str.replace("<th></th>", ""); // Remove empty column in thead where buttons were
    cart_str = cart_str.replace("<td></td>", ""); // Remove empty column in tbody where buttons were

    const response = await axios.post("http://localhost:3000/pay", {
      encrypted_email: email,
      auth_tag: tag,
      pay: confirm,
      payment_method: payment_method,
      cart_items: cart_str,
    });

    if (response.data.success) {
      // Undo hidden navigation bar
      const nav_item_els = document.getElementsByClassName("nav-item");
      for (let i = 0; i < nav_item_els.length; i++) {
        nav_item_els[i].classList.toggle("disabled-navbar-links", false); // Remove disabled feature to navigation buttons
        nav_item_els[i].style.display = "flex"; // Unhide navigation buttons
      }
      // Unhide search bar
      document.getElementById("inp-searchbar").style.display = "block";
      document.getElementById("btn-searchbar").style.display = "block";
      loadLoginPage();
    } else {
      // Undo hidden navigation bar
      const nav_item_els = document.getElementsByClassName("nav-item");
      for (let i = 0; i < nav_item_els.length; i++) {
        nav_item_els[i].classList.toggle("disabled-navbar-links", false); // Remove disabled feature to navigation buttons
        nav_item_els[i].style.display = "flex"; // Unhide navigation buttons
      }
      // Unhide search bar
      document.getElementById("inp-searchbar").style.display = "block";
      document.getElementById("btn-searchbar").style.display = "block";
      loadCartPage();
    }
  } catch (error) {
    console.error("Error processing payment: ", error);
  }
}
