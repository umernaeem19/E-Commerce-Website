import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";
import mysql from "mysql2";
//import { v4 as uuidv4 } from 'uuid';
import stripe from 'stripe';
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
const router = express.Router();
app.use(express.json());
app.set("view engine", "ejs");
const PUBLISHABLE_KEY="pk_test_51OJtuIJKeBRiVd9Q77K37puMcCb8YmmDOBDnpgWPS4LKZb8l4lPGsSs7efvMhXWQesYI9EGJojJjWFZ7oswVgYqk00awcJYVXY"
const SECRET_KEY="sk_test_51OJtuIJKeBRiVd9Q4vvWtKr2qncPZ2RABm3QXFORcqNlkLXVTbxgqlPtc6bPXDjxn23oRVBurOjSvlXBVrZQLPWo00c9lVmdQN"
const stripeInstance = stripe(SECRET_KEY);
// MySQL Connection Configuration
let globalEmail;
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'myuser',
  password: 'abc123',
  database: 'store'
});
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Handle MySQL disconnection event
connection.on('end', () => {
  console.log('Disconnected from MySQL');
});

// Serve static files
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve login page by default
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/public/home.html"));
});
console.log("working");

app.post("/test", (req, res) => {
  // Retrieve user data from the form
  const {fullname, email, password, date, gender,address,phone } = req.body;

  // Log the data to the console
  console.log("Data received from the login form:");
  console.log("Full Name:", fullname);
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Date:", date);
  console.log("Gender:", gender);
  console.log('Address:', address);
  console.log('Phone:', phone);

  // Check if the email already exists
  const checkEmailQuery = "SELECT COUNT(*) AS emailCount FROM Users WHERE Email = ?";

    
  connection.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      console.error("Error checking email:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const emailCount = results[0].emailCount;

    if (emailCount > 0) {
      // Email already exists, send a message to the user
      res.status(400).send("You are already a member. Please login.");
    } else {
      // Email doesn't exist, proceed to insert the new user
      // Query to get the maximum existing User_ID
      const getMaxUserIdQuery = "SELECT MAX(CAST(SUBSTRING(User_ID, 2) AS SIGNED)) AS maxUserId FROM Users";

      connection.query(getMaxUserIdQuery, (err, results) => {
        if (err) {
          console.error("Error getting max user ID:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        // Generate the new User_ID by incrementing the maxUserId
        const maxUserId = results[0].maxUserId || 1000;
        const newUserId = `U${maxUserId + 1}`;

        // Insert user data into the Users table
        const insertUserQuery = `
          INSERT INTO Users (User_ID, Username, Passwords, Email, First_name, Last_name, Address, Phone_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(
          insertUserQuery,
          [newUserId, fullname, password, email, fullname,"",address,phone], // You might want to modify this depending on your actual database schema
          (err, results) => {
            if (err) {
              console.error("Error inserting user data:", err);
              res.status(500).send("Internal Server Error");
              return;
            }

            console.log("User data inserted successfully!");
            // Redirect the user to the home page or perform any other necessary action
            res.sendFile(path.join(__dirname, "home.html"));
          }
        );
      });
    }
  });
});

//newsletter subscribe
app.post("/signup", (req, res) => {
  const email = req.body.email;

  // Insert the email into the 'promotions' table
  connection.query('INSERT INTO Promotions (email) VALUES (?)', [email], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error inserting data into the database' });
    }
     // Send a success message as JSON response
     res.status(200).json({ message: 'Successfully subscribed to the newsletter' });
    });
  });


// Handle login form submission
app.post("/t1", (req, res) => {
  // Retrieve user data from the form
  const { email, password } = req.body;
  globalEmail = email;

  // Query to check if the email exists in the Users table
  const checkEmailQuery = "SELECT * FROM Users WHERE Email = ?";
  connection.query(checkEmailQuery, [email], (err, results) => {
    if (err) {
      console.error("Error checking email:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    console.log(results);

    // Check if the email exists
    if (results.length === 0) {
      console.log("Email not found");
      res.status(404).send("Email not found");
      return;
    }

    // Email exists, check the password
    const storedPassword = results[0].Passwords;
    const userId = results[0].User_ID;

    if (password === storedPassword) {
      // Passwords match, fetch username and product information from Users and Orders tables
      const fetchUserDataQuery = "SELECT Username FROM Users WHERE User_ID = ?";
      connection.query(fetchUserDataQuery, [userId], (err, userResults) => {
        if (err) {
          console.error("Error fetching user information:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        // Check if the user with the specified User_ID exists
        if (userResults.length === 0) {
          console.error("User not found");
          res.status(500).send("Internal Server Error");
          return;
        }

        // Extract the username from the results
        const username = userResults[0].Username;
        console.log(username);
        // Fetch product information from the Orders table
        const fetchProductQuery = "SELECT product_name, product_image FROM Orders WHERE User_user_id = ?";
        connection.query(fetchProductQuery, [userId], (err, productResults) => {
          if (err) {
            console.error("Error fetching product information:", err);
            res.status(500).send("Internal Server Error");
            return;
          }

          // Transform product results to productData
          const productData = productResults.map(product => ({
            productName: product.product_name,
            productImage: product.product_image
          }));

          // Render a new HTML page and pass the username and productData to it
          res.render('home2', { username, productData });
        });
      });
    } else {
      // Passwords don't match
      console.log("Incorrect password");
      res.status(401).send("Incorrect password");
    }
  });
});

app.get("/product1",function(request,response,next){
  var query="Select * from Products where Product_ID=1001";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});



// app.get("/home2.ejs",function (req, res) {
//   res.render(path.join(__dirname, "/views/home2.ejs"));
// });
// bilal said cooment in incase 
// Handle login form submission
// app.post("/t1", (req, res) => {
  // // Retrieve user data from the form
  // const { email, password } = req.body;

  // // Query to check if the email exists in the Users table
  // const checkEmailQuery = "SELECT * FROM Users WHERE Email = ?";
  // connection.query(checkEmailQuery, [email], (err, results) => {
  //   if (err) {
  //     console.error("Error checking email:", err);
  //     res.status(500).send("Internal Server Error");
  //     return;
  //   }
  //   console.log(results);

  //   // Check if the email exists
  //   if (results.length === 0) {
  //     console.log("Email not found");
  //     res.status(404).send("Email not found");
  //     return;
  //   }

  //   // Email exists, check the password
  //   const storedPassword = results[0].Passwords;
  //   const userId = results[0].User_ID;

  //   if (password === storedPassword) {
  //     // Passwords match, fetch username and product information from Users and Orders tables
  //     const fetchUserDataQuery = "SELECT Username FROM Users WHERE User_ID = ?";
  //     connection.query(fetchUserDataQuery, [userId], (err, userResults) => {
  //       if (err) {
  //         console.error("Error fetching user information:", err);
  //         res.status(500).send("Internal Server Error");
  //         return;
  //       }

  //       // Check if the user with the specified User_ID exists
  //       if (userResults.length === 0) {
  //         console.error("User not found");
  //         res.status(500).send("Internal Server Error");
  //         return;
  //       }

  //       // Extract the username from the results
  //       const username = userResults[0].Username;
  //       console.log(username);
  //       // Fetch product information from the Orders table
  //       const fetchProductQuery = "SELECT product_name, product_image FROM Orders WHERE User_user_id = ?";
  //       connection.query(fetchProductQuery, [userId], (err, productResults) => {
  //         if (err) {
  //           console.error("Error fetching product information:", err);
  //           res.status(500).send("Internal Server Error");
  //           return;
  //         }

  //         // Transform product results to productData
  //         const productData = productResults.map(product => ({
  //           productName: product.product_name,
  //           productImage: product.product_image
  //         }));

  //         // Render a new HTML page and pass the username and productData to it
  //         res.render('productPage', { username, productData });
  //       });
  //     });
  //   } else {
  //     // Passwords don't match
  //     console.log("Incorrect password");
  //     res.status(401).send("Incorrect password");
  //   }
  // });


// app.get("/product1",function (req, res) {
 
// });

app.get("/productpage", (req, res) => {
  // Retrieve user data from the form
  

  // Query to check if the email exists in the Users table
  const checkEmailQuery = "SELECT * FROM Users WHERE Email = ?";
  connection.query(checkEmailQuery, [globalEmail], (err, results) => {
    if (err) {
      console.error("Error checking email:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    console.log(results);

    // Check if the email exists
    if (results.length === 0) {
      console.log("Email not found");
      res.status(404).send("Email not found");
      return;
    }

    // Email exists, check the password
    
    const userId = results[0].User_ID;

    
      // Passwords match, fetch username and product information from Users and Orders tables
      const fetchUserDataQuery = "SELECT Username FROM Users WHERE User_ID = ?";
      connection.query(fetchUserDataQuery, [userId], (err, userResults) => {
        if (err) {
          console.error("Error fetching user information:", err);
          res.status(500).send("Internal Server Error");
          return;
        }

        // Check if the user with the specified User_ID exists
        if (userResults.length === 0) {
          console.error("User not found");
          res.status(500).send("Internal Server Error");
          return;
        }

        // Extract the username from the results
        const username = userResults[0].Username;
        console.log(username);
        // Fetch product information from the Orders table
        const fetchProductQuery = "SELECT product_name, product_image FROM Orders WHERE User_user_id = ?";
        connection.query(fetchProductQuery, [userId], (err, productResults) => {
          if (err) {
            console.error("Error fetching product information:", err);
            res.status(500).send("Internal Server Error");
            return;
          }

          // Transform product results to productData
          const productData = productResults.map(product => ({
            productName: product.product_name,
            productImage: product.product_image
          }));

          // Render a new HTML page and pass the username and productData to it
          res.render('productpage', { username, productData });
        });
      });
     
  });
});


app.get("/home2.ejs",function(request,response,next){
  var query="Select * from Products where Product_ID=1001";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('home2',{username:'bilal'});
    }
  });
});
console.log("eokokfds");
app.get("/product",function(request,response,next){
  var query="Select * from Products where Product_ID=2312";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

//products ejs
app.get("/productm1",function(request,response,next){
  var query="Select * from Products where Product_ID=1001";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      //console.log()
      response.render('1001',{sampleData:data});

    }
  });
});

app.get("/productm2",function(request,response,next){
  var query="Select * from Products where Product_ID=1002";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productm3",function(request,response,next){
  var query="Select * from Products where Product_ID=1003";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productm4",function(request,response,next){
  var query="Select * from Products where Product_ID=1004";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productm5",function(request,response,next){
  var query="Select * from Products where Product_ID=1005";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});
app.get("/productm6",function(request,response,next){
  var query="Select * from Products where Product_ID=1006";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});
app.get("/productm6",function(request,response,next){
  var query="Select * from Products where Product_ID=1006";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});
app.get("/productm7",function(request,response,next){
  var query="Select * from Products where Product_ID=1007";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productm8",function(request,response,next){
  var query="Select * from Products where Product_ID=1008";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productf1",function(request,response,next){
  var query="Select * from Products where Product_ID=1009";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productf2",function(request,response,next){
  var query="Select * from Products where Product_ID=1010";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productf3",function(request,response,next){
  var query="Select * from Products where Product_ID=1011";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productf4",function(request,response,next){
  var query="Select * from Products where Product_ID=1012";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productf5",function(request,response,next){
  var query="Select * from Products where Product_ID=1013";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});


app.get("/productf6",function(request,response,next){
  var query="Select * from Products where Product_ID=1014";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productf7",function(request,response,next){
  var query="Select * from Products where Product_ID=1015";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/productf8",function(request,response,next){
  var query="Select * from Products where Product_ID=1016";
  connection.query(query,function(error,data){
    if(error){
      throw error;
    }
    else{
      response.render('1001',{sampleData:data});
    }
  });
});

app.get("/get_payment", (req, res) => {
  const amount = req.query.amount;

  // Fetch the username from the Users table (replace 'userId' with the actual user ID)
  const userId = 'U1001'; // Replace with the actual user ID; you might get this from the user's session
  const fetchUsernameQuery = "SELECT Username FROM Users WHERE User_ID = ?";

  connection.query(fetchUsernameQuery, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching username:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    const username = results.length > 0 ? results[0].Username : "DefaultUsername";

    res.render('payment', {
      key: PUBLISHABLE_KEY,
      amount: amount,
      username: username  // Pass the username variable to the template
    });
  });
});






app.post('/payment',(req,res)=>{
  stripeInstance.customers.create({
    email:req.body.stripeEmail,
    source:req.body.stripeToken,
    name:'bilal',
    address:{
      line1:'kyu bataon',
      postal_code:'4522',
      city:'Karachi',
      state:'fast',
      country:'india'
    }
  })
  .then((customer)=>{
    return stripeInstance.charges.create({
      amount:7000,
      description:'One tshirt',
      currency:'USD',
      customer:customer.id
    })
  })
  .then((charge)=>{
    res.send("success")
  })
  .catch((err)=>{
    res.send(err)
  })
})

let orderIdCounter = 0; // Counter to generate sequential order IDs

app.post('/checkout', (req, res) => {
  const userId = 'U1001'; // Replace with the actual user ID; you might get this from the user's session

  // Extract order items from the request body
  const orderItems = req.body.orderItems;

  // Process each order item
  const promises = orderItems.map(item => {
    return new Promise((resolve, reject) => {
      const { productName, productImage, subtotal } = item;

      // Increment the order ID counter 
      orderIdCounter++;

      // Insert order items into the Orders table
      const numericTotalAmount = parseFloat(subtotal.replace('$', ''));
      const insertOrderQuery = `
        INSERT INTO Orders (Order_ID, Order_Date, Total_Amount, Order_Status, User_user_id, product_name, product_image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        insertOrderQuery,
        [orderIdCounter, '2023-01-01', numericTotalAmount, 'Success', userId, productName, productImage],
        (err, results) => {
          if (err) {
            console.error("Error inserting order item:", err);
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    });
  });

  // Wait for all promises to resolve before sending the response
  Promise.all(promises)
    .then(() => {
      res.json({ success: true });
    })
    .catch(error => {
      console.error("Error inserting order items:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});



  // Wait for all promises to resolve before sending the response

app.use("/api", router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
