const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Connecting server
mongoose.connect("mongodb+srv://admin-user:test123@to-do-list-cluster.rkzylh2.mongodb.net/todolistDB");

//Creating a new schema
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

//Creating the model
const Item = mongoose.model("Item", itemSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
//Instead of the above we build three default document for beginning
const item1 = new Item({
  name: "Welcome to your to do list",
});

const item2 = new Item({
  name: "Press + to add an item",
});

const item3 = new Item({
  name: "Checkbox to delete",
});

// const workItems = [];
//Creating array of items of objects
const defaultItems = [item1, item2, item3];

/*

Creating new schemas for custom list
There will a schema which contains schema of prev lists
More like a schema of schema

const itemSchema = new mongoose.Schema({
  name:{ type:String, required : true}
});

now we can create a customSchema which contains many other schemas like general-to-list, work-to-do, kitchen-to-do

*/

const customListSchema = mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", customListSchema);

//Insert Many to insert all the item once

app.get("/", async function (req, res) {
  try {
    const items = await Item.find({});
    if (items.length == 0) {
      await Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  } catch (err) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (req.body.list === "Today") {
    await newItem.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName }).exec();
    if (foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    }
  }
});

app.post("/delete", async function (req, res) {
  // console.log(req.body); ->{ checkbox: 'hello' }
  // console.log(req.body);

  try {
    const id = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      await Item.deleteOne({ _id: id });

      res.redirect("/");
    } else {
      const updatedList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: id } } },
        { new: true }
      );

      if (updatedList) {
        res.redirect("/" + listName);
      } else {
        console.error("List not found");
        res.status(404).send("List not found");
      }
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = req.params.customListName;

  const foundList = await List.findOne({ name: customListName }).exec();

  if (!foundList) {
    const list = new List({
      name: customListName,
      items: defaultItems, // Assign defaultItems to the items array for the custom list
    });

    // Save the list to MongoDB (You may need to adjust this logic based on your requirements)
    list.save();
    res.redirect("/" + customListName);
  } else res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
