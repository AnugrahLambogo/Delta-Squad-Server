const express = require("express");
const logger = require("../logger");
const PantryService = require("./pantry-service");
const AccountService = require("../users/users-service");
const requireAuth = require("../middleware/jwt-auth");
const xss = require("xss");
const path = require("path");

const bodyParser = express.json();
const pantryRouter = express.Router();

const serializeIngredient = (ingredient) => {
  return {
    ...ingredient
  };
};

pantryRouter
  .route("/")
  .get(requireAuth, (req, res, next) => {
    let user_id = req.user.id;
    // console.log("req.query is", req.query);
    PantryService.getIngredients(req.app.get("db"), user_id)
      .then((ingredients) => {
        if (req.query.q) {
          const filterResults = ingredients.filter((ingredient) => {
            return ingredient.ingredient_name.toLowerCase().includes(req.query.q.toLowerCase());
          });
          res.json(filterResults.map(serializeIngredient));
        } else {
          // console.log("ingredients list is", ingredients);
          res
            .status(200)
            .json(ingredients);
        }

      })
      .catch((err) => {
        next(err);
      });
  })

  .post(requireAuth, bodyParser, (req, res, next) => {
    // console.log("ingredient POST req.body is", req.body);
    let { ingredient_name, in_stock, notes } = req.body;
    let ingredient_owner = req.user.id;
    const newIngredient = {
      ingredient_name: ingredient_name.toLowerCase(),
      in_stock, notes,
      ingredient_owner
    };
    // console.log("new ingredient from req is", newIngredient);
    for (const [key, value] of Object.entries(newIngredient)) {
      if (value === null) {
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` }
        });
      }
    }
    PantryService.addIngredient(req.app.get("db"), newIngredient)
      .then(ingredient => {
        // console.log("res is", serializeIngredient(ingredient));
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${ingredient.id}`))
          .json(serializeIngredient(ingredient));
      })
      .catch((err) => {
        next(err);
      });
  });

pantryRouter
  .route("/:ingredient_id")
  .patch(requireAuth, bodyParser, (req, res, next) => {
    let { id, ingredient_name, in_stock, notes } = req.body;
    let updatedIngredient = { id, ingredient_name, in_stock, notes };
    let ingredientId = req.body.id;
    console.log("updatedIngredient is", updatedIngredient);
    PantryService.updateIngredient(req.app.get("db"), updatedIngredient, id)
      .then((updatedIngredientResponse) => {
        console.log("updatedPatch is", updatedIngredientResponse);
        res
          .status(201)
          .json(updatedIngredientResponse);
      })
      .catch((err) => {
        next(err);
      });
  })
  .delete(requireAuth, (req, res, next) => {
    // console.log("ingredient id in delete is", req.params);
    PantryService.deleteIngredient(
      req.app.get("db"),
      req.params.ingredient_id
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });



module.exports = pantryRouter;