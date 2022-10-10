const mongoose = require("mongoose");
mongoose
  .connect('mongodb+srv://admin-arham:test123@cluster0.dppdy.mongodb.net/?retryWrites=true&w=majority', { 
    useNewUrlParser: true,
    useUnifiedTopology: true, 
  })
  .then((e) => {
    console.log(`MongoDB Connected`);
  })
  .catch((e) => {
    console.log("MongoDB Connection error.", e.message);
  });
