const async = require('async');
const { body, validationResult } = require('express-validator');

const Book = require('../models/book');
const Genre = require('../models/genre');

// Display list of all Genre.
exports.genre_list = function (req, res) {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_of_genres) {
      if (err) {
        return next(err);
      }

      res.render('genre_list', {
        title: 'Genre List',
        genre_list: list_of_genres,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) return next(err);

      if (results.genre == null) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }

      res.render('genre_detail', {
        type: 'Genre Detail',
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array(),
      });
    } else {
      Genre.findOne({ name: req.body.name }).exec(function (err, found_genre) {
        if (err) return next(err);

        if (found_genre) {
          res.redirect(found_genre.url);
        } else {
          genre.save(function (err) {
            if (err) return next(err);
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      books: function (callback) {
        Book.find({ genre: req.params.id }).populate('author').exec(callback);
      },
    },
    (err, results) => {
      if (err) return next(err);

      res.render('genre_delete', {
        title: 'Delete Genre',
        genre: results.genre,
        books: results.books,
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) return next(err);

      if (results.books.length > 0) {
        res.render('genre_delete', {
          title: 'Delete Genre',
          genre: results.genre,
          books: results.books,
        });
      } else {
        Genre.findByIdAndRemove(req.params.id, function (err) {
          if (err) return next(err);

          res.redirect('/catalog/genres');
        });
      }
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
  Genre.findById(req.params.id).exec(function (err, genre) {
    if (err) return next(err);

    res.render('genre_form', { title: 'Update Genre', genre });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    const newGenre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Update Genre',
        genre: newGenre,
        errors: errors.array(),
      });
      return;
    } else {
      Genre.findByIdAndUpdate(
        req.params.id,
        newGenre,
        {},
        function (err, theGenre) {
          if (err) return next(err);
          res.redirect(theGenre.url);
        }
      );
    }
  },
];
