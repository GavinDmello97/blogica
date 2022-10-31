var express = require("express");
const bodyParser = require("body-parser");
var passport = require("passport");
var path = require("path");
const Article = require("../models/articles");
const User = require("../models/users");
const authenticate = require("../config/authenticate");
const cors = require("../config/cors");
const UserPropUpdate = require("../components/UserPropUpdate");
const DataTrimmer = require("../components/DataTrimmer");
const UploadFile = require("../components/UploadFile");

var userRouter = express.Router();
userRouter.use(bodyParser.json());

userRouter.options("*", cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
});

/* GET users listing. */
userRouter.get(
  "/",
  cors.corsWithOptions,

  (req, res, next) => {
    // text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "")
    var filters = {
      $or: [
        {
          firstname: {
            $regex: req.query.search
              ? req.query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "")
              : "",
            $options: "i",
          },
        },
        {
          lastname: {
            $regex: req.query.search
              ? req.query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "")
              : "",
            $options: "i",
          },
        },
      ],
      admin: false,
      "published.articles.0": { $exists: true },
    };

    User.find(filters)
      .sort({ points_earned: -1 })
      .limit(req.query.limit)
      .skip(req.query.offset)
      .then(
        (users) => {
          if (users) {
            User.count(filters).then(
              (count) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json({
                  results: DataTrimmer.trimAuthorList(users),
                  limit: Number(req.query.limit),
                  nextOffset:
                    Number(req.query.offset) + Number(req.query.limit),
                  count,
                });
              },
              (err) => next(err)
            );
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  }
);

userRouter.get(
  "/userDetails",
  cors.cors,
  authenticate.verifyUser,
  (req, res, next) => {
    console.log(req.query.isProfile);
    User.findById(req.user._id)
      .populate(
        req.query.isProfile &&
          req.query.isProfile == "true" && [
            {
              path: `published.articles`,
              populate: [
                {
                  path: "author",
                  model: "User",
                },
              ],
            },
            {
              path: `recents.articles`,
              populate: [
                {
                  path: "author",
                  model: "User",
                },
              ],
            },
            {
              path: `saved.articles`,
              populate: [
                {
                  path: "author",
                  model: "User",
                },
              ],
            },
            {
              path: "badges.badge",
            },
          ]
      )
      .then(
        async (user) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          console.log(user);
          const {
            published,
            recents,
            favorites,
            saved,
            _id,
            firstname,
            lastname,
            bio,
            image_url,
            username,
            badges,
            createdAt,
            updatedAt,
            points_earned,
            points_spent,
          } = user;

          var userDetails = {
            _id,
            firstname,
            lastname,
            bio,
            image_url,
            username,
            createdAt,
            updatedAt,
          };

          if (req.query.isProfile && req.query.isProfile == "true") {
            userDetails = {
              ...userDetails,
              points_earned,
              points_spent,
              saved: {
                articles: DataTrimmer.trimArticleList(saved.articles, true),
              },
              favorites: {
                articles: DataTrimmer.trimArticleList(favorites.articles, true),
              },
              badges: DataTrimmer.trimBadgeList(badges),
              recents: {
                articles: DataTrimmer.trimArticleList(recents.articles, true),
              },
              published: {
                articles: DataTrimmer.trimArticleList(published.articles, true),
              },
            };
          } else {
            userDetails = { ...userDetails, saved, favorites, published };
          }

          res.json(userDetails);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  }
);

userRouter.get("/authorDetails", cors.cors, (req, res, next) => {
  if (req.query.author_id) {
    User.findById(req.query.author_id)
      .populate([
        {
          path: `published.articles`,
          populate: [
            {
              path: "author",
              model: "User",
            },
          ],
        },

        {
          path: "badges.badge",
        },
      ])
      .then(
        async (user) => {
          const {
            published,
            _id,
            firstname,
            lastname,
            bio,
            image_url,
            username,
            badges,
            createdAt,
            updatedAt,
          } = user;

          console.log(user);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json({
            _id,
            firstname,
            lastname,
            bio,
            image_url,
            username,
            published: {
              articles: DataTrimmer.trimArticleList(published.articles, true),
            },
            badges: DataTrimmer.trimBadgeList(badges),
            createdAt,
            updatedAt,
          });
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  } else {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    next(new Error("Author Id missing"));
  }
});

userRouter.post(
  "/signup",
  cors.cors,
  UploadFile.multerConfig().single("image"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(401).json({ error: "Please provide an image" });
    }
    var image_url = await UploadFile.uploadPhoto(req.file, "users", 720, 720);

    // register is a passport method
    User.register(
      new User({
        username: req.body.username,
      }),
      req.body.password,
      (err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.json({ err: err });
        } else {
          user.firstname = req.body.firstname;
          user.lastname = req.body.lastname;
          user.email = req.body.email;
          user.image_url = image_url;
          user.bio = req.body.bio;
          user.save((err, user) => {
            if (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.json({ err: err });
              return;
            }
            passport.authenticate("local")(req, res, () => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json({ success: true, status: "Registration Successful!" });
            });
          });
        }
      }
    );
  }
);

userRouter.post("/signin", cors.corsWithOptions, (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      return res.json({
        success: false,
        status: "Login Unsuccessful!",
        err: info,
      });
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        return res.json({
          success: false,
          status: "Login Unsuccessful!",
          err: "Could not log in user!",
        });
      }

      var token = authenticate.getToken({ _id: req.user._id });
      User.findById(req.user._id)
        // .populate(["published.articles"])
        .then(
          (user) => {
            const {
              published,
              saved,
              favorites,
              _id,
              firstname,
              lastname,
              bio,
              image_url,
              username,
              createdAt,
            } = user;
            var userDetails = {
              _id,
              firstname,
              lastname,
              image_url,
              username,
              published,
              saved,
              favorites,
              createdAt,
            };
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({
              success: true,
              status: "Login Successful!",
              token: token,
              user: userDetails,
            });
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    });
  })(req, res, next);
});

userRouter.post("/usernameCheck", cors.corsWithOptions, (req, res, next) => {
  User.find({}, "username", (err, docs) => {
    if (err) {
      return next(err);
    }
    var tempData = docs.map((doc) => doc.username);
    if (tempData.includes(req.body.username)) {
      statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.json({ status: "failed", message: "Username already taken!" });
    } else {
      statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({ status: "success", message: "Username available!" });
    }
  });
});

userRouter.get("/checkJWTtoken", cors.corsWithOptions, (req, res) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      return res.json({ status: "JWT invalid!", success: false, err: info });
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.json({ status: "JWT valid!", success: true, user: user });
    }
  })(req, res);
});

var categories = ["favorites", "saved", "recents", "published"];
var properties = ["articles"];

userRouter
  .route("/category")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    if (req.query.property == "articles") {
      UserPropUpdate.getArticlesByProperty(req, res, next);
    }
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (req.query.category == "favorites" && req.query.property == "articles") {
      Article.findById(req.body.id).then((article) => {
        article.numberOfLikes += 1;
        article.save();
      });
    }
    if (req.query.property == "articles") {
      UserPropUpdate.addArticleToUser(req, res, next, true);
    }
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("Put operation not supported on /users/category");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if (
      categories.includes(req.query.category) &&
      properties.includes(req.query.property)
    ) {
      if (
        req.query.category == "favorites" &&
        req.query.property == "articles"
      ) {
        Article.findById(req.body.id).then((article) => {
          article.numberOfLikes -= 1;
          article.save();
        });
      }
      if (req.query.property == "articles") {
        UserPropUpdate.deleteArticlesFromUser(req, res, next);
      }
    } else {
      err = new Error(
        "Information about the category or the property does not exist in the system"
      );
      err.status = 404;
      return next(err);
    }
  });

module.exports = userRouter;