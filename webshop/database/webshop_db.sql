-- Create the Customers table
CREATE TABLE Customers (
    CustomerID INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    HashedPassword CHAR(60) NOT NULL,
    Code CHAR(4),
    PhoneNumber VARCHAR(20) NOT NULL,
    Street VARCHAR(255) NOT NULL,
    City VARCHAR(50) NOT NULL,
    State VARCHAR(50) NOT NULL,
    Postcode VARCHAR(20) NOT NULL, -- Some countries have postcodes with alphabets and more than 10 characters
    Country VARCHAR(33) NOT NULL,
    isLoggedIn BOOLEAN NOT NULL DEFAULT 0
);

-- Create the Products table
CREATE TABLE Products (
    ProductID INT PRIMARY KEY AUTO_INCREMENT,
    ProductName VARCHAR(100) NOT NULL,
    ProductImg VARCHAR(100) NOT NULL,
    Description TEXT,
    Category VARCHAR(50) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    StockQuantity INT NOT NULL
);

-- Create the Orders table
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY AUTO_INCREMENT,
    CustomerID INT,
    OrderDate DATETIME NOT NULL,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    PaymentMethod VARCHAR(20) NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

-- Create a junction table to handle many-to-many relationship between Orders and Products
CREATE TABLE OrderDetails (
    OrderDetailID INT PRIMARY KEY AUTO_INCREMENT,
    OrderID INT,
    ProductID INT,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

CREATE TABLE CartDetails (
    CartDetailsID INT PRIMARY KEY AUTO_INCREMENT,
    CustomerID INT,
    ProductID INT,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

CREATE TABLE TransactionTimeouts (
    TransactionID INT PRIMARY KEY AUTO_INCREMENT,
    CustomerID INT,
    ExpirationTime DATETIME NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

INSERT INTO Customers (FirstName, LastName, Email, HashedPassword, PhoneNumber, Street, City, State, Postcode, Country) VALUES
('John', 'Doe', 'john.doe@example.com', '$2b$10$VyHc5YV3X47MNulyuS4IUeEx7gNXqy7w/OsI2UKssvvw8U8Azw4aa', '555-1234', '123 Elm St', 'Springfield', 'IL', '62701', 'United States'),
('Jane', 'Smith', 'jane.smith@example.com', '$2b$10$Lb0QXkntHMJU3a0pkoklwer.WsYZjy5.5GGr4L88fHaIrDSp0cU/a', '555-5678', '456 Oak St', 'Lincoln', 'NE', '68508', 'United States'),
('Alice', 'Johnson', 'alice.johnson@example.com', '$2b$10$TqECMp.yXqfATTBowZPv9ePh077C9pgAAm1vnfdGLUg9IZLK0DNvu','555-8765', '789 Pine St', 'Columbus', 'OH', '43215', 'United States'),
('Bob', 'Brown', 'bob.brown@example.com', '$2b$10$aAR0N.IP78IZWt.UhITnf.Ingud0.Y9yFc12ipSbIvE98N.dkKy0u', '555-4321', '101 Maple St', 'Madison', 'WI', '53703', 'United States'),
('Carol', 'Williams', 'carol.williams@example.com', '$2b$10$KDHj21SnMzWWPk6uFgRiuuvpb9/KKP3mZj1kS4BVDYmsRo1CwYdZS', '555-6789', '202 Birch St', 'Austin', 'TX', '73301', 'United States');

INSERT INTO Products (ProductName, ProductImg, Description, Category, Price, StockQuantity) VALUES
('Coke Sakura', 'https://i.imgur.com/xuEoILS.jpeg', 'Coca-cola drink with sakura flavour', 'Drinks', 5.99, 10),
('Dango', 'https://i.imgur.com/rMZ6Cku.png', 'Our classic favourite, made with sakura, matcha and plain mochi', 'Traditional Snacks', 8.00, 25),
('Doriyaki', 'https://i.imgur.com/WDZBso4.jpeg', 'Red bean paste-filled pastry popularised by Doraemon', 'Traditional Snacks', 10.00, 50),
('Oreo Crispy Matcha', 'https://i.imgur.com/sHp1nSc.png', 'Thin Oreos in matcha flavour', 'Biscuits', 7.99, 15),
('Yakult 1000', 'https://i.imgur.com/JKIrBpH.png', 'Probiotic drink made of 100 billion units of the healthy lactic acid bacteria strain known as “Lactobacillus casei strain Shirota”', 'Drinks', 10.00, 20);

-- Insert orders with datetime values
INSERT INTO Orders (CustomerID, OrderDate, TotalAmount, PaymentMethod) VALUES
(1, '2024-08-25 14:30:00', 21.98, 'Credit Card'),   -- Order by John Doe
(2, '2024-08-26 09:15:00', 24.00, 'Debit Card'),        -- Order by Jane Smith
(3, '2024-08-27 16:45:00', 27.99, 'Credit Card'),   -- Order by Alice Johnson
(4, '2024-08-28 11:00:00', 10.00, 'Cash on Delivery'), -- Order by Bob Brown
(5, '2024-08-29 20:30:00', 29.97, 'Credit Card');   -- Order by Carol Williams

-- Insert order details
INSERT INTO OrderDetails (OrderID, ProductID, Quantity, UnitPrice) VALUES
-- Order by John Doe (OrderID = 1)
(1, 1, 2, 5.99),  -- 2 units of Coke Sakura
(1, 3, 1, 10.00), -- 1 unit of Doriyaki

-- Order by Jane Smith (OrderID = 2)
(2, 2, 3, 8.00),  -- 3 units of Dango

-- Order by Alice Johnson (OrderID = 3)
(3, 4, 1, 7.99),  -- 1 unit of Oreo Crispy Matcha
(3, 5, 2, 10.00), -- 2 units of Yakult 1000

-- Order by Bob Brown (OrderID = 4)
(4, 3, 1, 10.00), -- 1 unit of Doriyaki

-- Order by Carol Williams (OrderID = 5)
(5, 1, 1, 5.99),  -- 1 unit of Coke Sakura
(5, 2, 1, 8.00),  -- 1 unit of Dango
(5, 4, 2, 7.99);  -- 2 units of Oreo Crispy Matcha

-- Insert cart details
INSERT INTO CartDetails (CustomerID, ProductID, Quantity, UnitPrice) VALUES
-- Cart for John Doe (CustomerID = 1)
(1, 1, 1, 5.99),  -- 1 unit of Coke Sakura
(1, 2, 2, 8.00),  -- 2 units of Dango

-- Cart for Jane Smith (CustomerID = 2)
(2, 3, 1, 10.00), -- 1 unit of Doriyaki
(2, 4, 3, 7.99),  -- 3 units of Oreo Crispy Matcha

-- Cart for Alice Johnson (CustomerID = 3)
(3, 1, 2, 5.99),  -- 2 units of Coke Sakura
(3, 5, 1, 10.00), -- 1 unit of Yakult 1000

-- Cart for Bob Brown (CustomerID = 4)
(4, 2, 1, 8.00),  -- 1 unit of Dango
(4, 3, 2, 10.00), -- 2 units of Doriyaki

-- Cart for Carol Williams (CustomerID = 5)
(5, 4, 1, 7.99),  -- 1 unit of Oreo Crispy Matcha
(5, 5, 3, 10.00); -- 3 units of Yakult 1000
