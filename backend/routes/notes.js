const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Notes = require("../models/Notes");
const { body, validationResult } = require("express-validator");

//ROUTE 1: Get all the notes using : GET "api/auth/fetchallnotes". Login required

router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Notes.find({ user: req.user.id });
    res.json(notes);
    // res.send("hy there");
  } catch (error) {
    console.log(error);
    res.status(500).send("Enternal server error");
  }
});

//ROUTE 2: Add a new notes using : POST "api/note/addnotes". Login required

router.post(
  "/addnotes",
  fetchuser,
  [
    body("title", "Enter a valid title").isLength({ min: 3 }),
    body("description", "Description must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      const { title, description, tag } = req.body;
      //If there are errors, send bad request and the errors
      const errors = validationResult(req);
      if (!errors.isEmpty) {
        res.status(400).json({ errors: errors.array() });
      }

      const notes = new Notes({
        title,
        description,
        tag,
        user: req.user.id,
      });
      const saveNotes = await notes.save();
      res.json(saveNotes);
    } catch (error) {
      console.log(error);
      res.status(500).send("Enternal server error");
    }
  }
);

//ROUTE 3: Update an existing notes using : POST "api/note/updatenote". Login required

router.put("/updatenote/:id", fetchuser, async (req, res) => {
  try {
    console.log("we are in updateNote");
    const { title, description, tag } = req.body;

    //create a new note
    const newNote = {};
    if (title) {
      newNote.title = title;
    }
    if (description) {
      newNote.description = description;
    }
    if (tag) {
      newNote.tag = tag;
    }

    //Find the note to be updated and update it

    let note = await Notes.findById(req.params.id);
    if (!note) {
      return res.status(404).send("not found");
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(401).send("Not Allowed");
    }

    note = await Notes.findByIdAndUpdate(
      req.params.id,
      { $set: newNote },
      { new: true }
    );

    res.json({ note });
  } catch (error) {
    console.log(error);
    res.status(500).send("Enternal server error");
  }
});

module.exports = router;
