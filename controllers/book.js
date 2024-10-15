const { error } = require("console");
const Book = require("../models/Book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Livre enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => {
            if (req.file && book.imageUrl) {
              const imagePath = book.imageUrl.split("/images/")[1];
              fs.unlinkSync(`images/${imagePath}`);
            }
            res.status(200).json({ message: "Votre livre a été modifié !" });
          })
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Votre livre a été supprimé.." });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.bestRatings = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(500).json({ error: "Internal server error" });
    });
};

exports.rateOneBook = (req, res, next) => {
  const userId = req.body.userId;
  const grade = req.body.rating;
  if (grade < 0 || grade > 5) {
    return res
      .status(400)
      .json({ message: "La note doit être comprise entre 0 et 5." });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res
          .status(400)
          .json({ message: "Désolé, nous n'avons pas trouvé votre livre 😕 " });
      }
      if (book.userId === req.auth.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const hasAlreadyRated = book.ratings.some(
        (rating) => rating.userId.toString() === userId
      );
      if (hasAlreadyRated) {
        return res.status(400).json({ message: "Ce livre a déjà été noté" });
      }

      book.ratings.push({ userId, grade });

      const totalGrade = book.ratings.reduce(
        (accumulator, currentValue) => accumulator + currentValue.grade,
        0
      );
      const averageRating = totalGrade / book.ratings.length;

      const roundedAverageRating = parseFloat(averageRating.toFixed(1));

      book.averageRating = roundedAverageRating;

      book
        .save()
        .then(() => res.status(200).json(book))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};
