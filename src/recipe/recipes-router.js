const path = require("path");
const express = require("express");
const recipeService = require("./recipes-service");
const recipeRouter = express.Router();
const logger = require("../logger");
const bodyParser = express.json();
const xss = require("xss");

recipeRouter.route("/").get((req, res, next) => {
  const knexInstance = req.app.get("db");
  recipeService
    .getAllRecipes(knexInstance)
    .then(recipes => {
      res.json(recipes);
    })
    .catch(next);
});

recipeRouter.route("/:title").get((req, res, next) => {
  console.log(req.params);
  const knexInstance = req.app.get("db");
  const { title } = req.params;
  recipeService
    .getRecipeByTitle(knexInstance, title)
    .then(recipes => {
      if (!recipes) {
        logger.error(`Recipe with title ${title} not found`);
        return res.status(404).send("Recipe not found");
      }
      res.json({
        id: recipes.id,
        title: recipes.title,
        recipe_description: recipes.recipe_description,
        recipe_ingredients: recipes.recipe_ingredients,
        time_to_make: recipes.time_to_make,
        date_created: recipes.date_created,
        created_by: recipes.created_by
      });
    })
    .catch(next);
});

recipeRouter
  .route("/recipeByTitle/:title")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { title } = req.params;
    recipeService
      .getRecipeByTitle(knexInstance, title)
      .then(recipe => {
        if (!recipe) {
          logger.error(`Recipe with title ${title} not found`);
          return res.status(404).send("Recipe not found");
        }
        res.json({
          id: recipe.id,
          title: recipe.title,
          description: xss(recipe.recipe_description),
          recipe_ingredients: recipe.recipe_ingredients,
          time_to_make: recipe.time_to_make,
          date_created: recipe.date_created,
          created_by: recipes.created_by
        });
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { title } = req.params;
    recipeService
      .deleteRecipe(knexInstance, title)
      .then(recipe => {
        if (recipe === -1) {
          logger.error(`Recipe with title ${title} not found`);
          return res.status(404).send("Recipe not found");
        }
        logger.info(`Recipe with id ${title} has been deleted`);
        res.status(204).end();
      })
      .catch(next);
  });

recipeRouter.route("/").post(bodyParser, (req, res, next) => {
  const {
    title,
    recipe_description,
    recipe_ingredients,
    time_to_make
  } = req.body;

  if (!title) {
    logger.error("Title is required");
    return res.status(400).send("Title required");
  }

  if (!recipe_description) {
    logger.error("Recipe description is required");
    return res.status(400).send("Recipe description required");
  }

  if (!recipe_ingredients) {
    logger.error("Recipe ingredients is required");
    return res.status(400).send("Recipe ingredients required");
  }

  if (!time_to_make) {
    logger.error("Time to make is required");
    return res.status(400).send("Time to make required");
  }

  const recipe = {
    title,
    recipe_description,
    recipe_ingredients,
    time_to_make
  };

  const knexInstance = req.app.get("db");

  recipeService
    .insertRecipe(knexInstance, recipe)
    .then(recipe => {
      const { id } = recipe;
      logger.info(`Recipe with id of ${id} was created`);
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${recipe.id}`))
        .json(recipe);
    })
    .catch(next);
});

recipeRouter.patch("/edit/:id", bodyParser, (req, res, next) => {
  const knexInstance = req.app.get("db");
  const { id } = req.params;
  const {
    title,
    recipe_description,
    recipe_ingredients,
    time_to_make
  } = req.body;
  const updatedData = {
    title,
    recipe_description,
    recipe_ingredients,
    time_to_make
  };

  const numberOfValues = Object.values(updatedData).filter(Boolean).length;
  if (numberOfValues === 0) {
    return res.status(400).json({
      error: {
        message:
          "Request body must contain either 'title', 'recipe desription', 'recipe ingredients or 'time to make'"
      }
    });
  }

  recipeService
    .updateRecipe(knexInstance, id, updatedData)
    .then(update => {
      res.status(204).end();
    })
    .catch(next);
});

module.exports = recipeRouter;
