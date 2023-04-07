const bodyParser = require('body-parser');
const express = require('express');
const https = require('https');
const ejs = require('ejs');
// const date = require(__dirname +"/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");



const app = express();
 const PORT = process.env.PORT || 3000;
app.set('view engine' , 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));



// connection to the db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected!');
  })
  .catch(err => {
    console.log(`MongoDB connection error: ${err}`);
    process.exit(1);
  });

// construction of a schema 
const itemsSchema = {
  name :String
};
const listSchema = new mongoose.Schema({
  name: String,
  items:[itemsSchema],
});

// define the model for your collection
let Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model('List', listSchema);

// creating the docs

  // const item = new Item({name:"Welcome to your todolist!."});
  // item.save()
  //   .then(result => {
  //     console.log('Item saved successfully');
  //   })
  //   .catch(error => {
  //     if (error.writeErrors) {
  //       for (const err of error.writeErrors) {
  //         if (err.code === 11000) {
  //           console.error('Duplicate key error:', err.errmsg);
  //           // Handle the duplicate key error here
  //         } else if (err.code === 121) {
  //           console.error('Validation error:', err.errmsg);
  //           // Handle the validation error here
  //         } else {
  //           console.error('Unknown write error:', err);
  //           // Handle any other type of write error here
  //         }
  //       }
  //     } else {
  //       console.error('Unexpected error:', error);
  //       // Handle any other type of error here
  //     }
  //   });
  
    const item1 = new Item({name:"Wash all the house !."});
    const item2 = new Item({name:"cook food for my self!."});
    const item3 = new Item({name:"sleep early!."});
    const items = [item1,item2,item3];
    
 
app.get("/",(req, res)=> {

// find all docs available in our db 
Item.find({}).then((founddoc) =>{ 
  
  console.log(founddoc.length);
  if (founddoc.length === 0){
   
    Item.insertMany(items)
    .then(docs => {
    console.log(`Successfully inserted ${docs.length} documents.`);
})
.catch(err => {
  console.error(`Error inserting documents: ${err}`);
});
res.redirect("/");
  }
  else{
res.render('list',{listTitle:"Today",newListItems : founddoc});
  }
});}
);

app.post("/", function(req, res){

  let itemName = req.body.newItem;
  const listName = req.body.list; 
  const item = new Item({name:itemName});

  if(listName === "Today"){
     item.save();
  console.log(item);
  res.redirect("/");
  }else {

   List.findOne({ name:listName})
  .then(doc => {
    doc.items.push(item);
    doc.save();
    res.redirect("/" + listName);
    console.log(doc);
  })
  .catch(err => {
    console.error(err);
  });
  }


})

 app.post("/delete", function(req, res){

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName ==="Today"){
       
  Item.findByIdAndRemove(checkedItemId)
  .then((deletedDocument) => {
    console.log('Deleted document:', deletedDocument);
    res.redirect("/");
  })
  .catch((error) => {
    console.error('Error:', error);
  });
    } 
  else{
    List.findOneAndUpdate({name:listName},{$pull: {items:{_id:checkedItemId}}}) 
  .then(updatedDoc => {
    res.redirect("/" +listName);
    console.log(updatedDoc);
  })
  .catch(error => {
    console.error(error);
  });

  }



  


})

// let's create a dynamic route with express to direct our pages

// remember we used lodash to convert any lower case or upper case to capitalized case in order to format our code

app.get("/:customListName", function(req,res){
  const customListName =_.capitalize( req.params.customListName);
 // console.log(customListName);

List.findOne({ name:customListName})
  .then(doc => {
    if(!doc){
      const list = new List({name:customListName,items:items});
       list.save();
    res.redirect("/"+ customListName);
    }
    else{
      res.render('list',{listTitle:doc.name,newListItems :doc.items
    });
 
  }})
  .catch(err => {
    console.error(err);
  });
  
});

app.listen(PORT, () => { console.log("the server starts on 3000 port"); });
