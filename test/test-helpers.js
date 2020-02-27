const knex = require("knex");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// NEEDS MORE WORK, NOT BUILT OUT YET


/**
 * create a knex instance connected to postgres
 * @returns {knex instance}
 */
function makeKnexInstance() {
  return knex({
    client: "pg",
    connection: process.env.TEST_DATABASE_URL,
  });
}

/**
 * create a knex instance connected to postgres
 * @returns {array} of user objects
 */
function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: "test-user-1",
      first_name: "Test user 1",
      user_email: "test@test.1",
      password: "password",
      // date_created: Date.now()
    },
    {
      id: 2,
      user_name: "test-user-2",
      first_name: "Test user 2",
      user_email: "test@test.2",
      password: "password",
      // date_created: Date.now()
    },
  ];
}

/**
 * generate fixtures of languages and words for a given user
 * @param {object} user - contains `id` property
 * @returns {Array(languages, words)} - arrays of languages and words
 */

function makeIngredients() {
  return [
    {
      ingredient_name: "Test Ingredient 1",
      in_stock: "in-stock",
      notes: "Test notes 1",
      ingredient_owner: 1
    },
    {
      ingredient_name: "Test Ingredient 2",
      in_stock: "in-stock",
      notes: "Test notes 2",
      ingredient_owner: 1
    },
    {
      ingredient_name: "Test Ingredient 3",
      in_stock: "in-stock",
      notes: "Test notes 3",
      ingredient_owner: 2
    },
    {
      ingredient_name: "Test Ingredient 4",
      in_stock: "in-stock",
      notes: "Test notes 4",
      ingredient_owner: 2
    }
  ];
}

function makeRecipe(user) {
  const languages = [
    {
      id: 1,
      title: "Test language 1",
      user_id: user.id,
    },
  ];

  const words = [
    {
      id: 1,
      original: "original 1",
      translation: "translation 1",
      language_id: 1,
      next: 2,
    },
    {
      id: 2,
      original: "original 2",
      translation: "translation 2",
      language_id: 1,
      next: 3,
    },
    {
      id: 3,
      original: "original 3",
      translation: "translation 3",
      language_id: 1,
      next: 4,
    },
    {
      id: 4,
      original: "original 4",
      translation: "translation 4",
      language_id: 1,
      next: 5,
    },
    {
      id: 5,
      original: "original 5",
      translation: "translation 5",
      language_id: 1,
      next: null,
    },
  ];

  return [languages, words];
}

/**
 * make a bearer token with jwt for authorization header
 * @param {object} user - contains `id`, `username`
 * @param {string} secret - used to create the JWT
 * @returns {string} - for HTTP authorization header
 */
function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: "HS256",
  });
  return `Bearer ${token}`;
}

/**
 * remove data from tables and reset sequences for SERIAL id fields
 * @param {knex instance} db
 * @returns {Promise} - when tables are cleared
 */
function cleanTables(db) {
  return db.transaction(trx =>
    trx.raw(
      `TRUNCATE
        "recipe_ingredients",
        "ingredients",
        "recipes",
        "mealplans",
        "accounts"
        `
    )
      .then(() =>
        Promise.all([
          trx.raw("ALTER SEQUENCE recipe_ingredients_id_seq minvalue 0 START WITH 0"),
          trx.raw("ALTER SEQUENCE ingredients_id_seq minvalue 0 START WITH 0"),
          trx.raw("ALTER SEQUENCE recipes_id_seq minvalue 0 START WITH 0"),
          trx.raw("ALTER SEQUENCE mealplans_id_seq minvalue 0 START WITH 0"),
          trx.raw("ALTER SEQUENCE accounts_id_seq minvalue 0 START WITH 0"),
          trx.raw("SELECT setval('recipe_ingredients_id_seq', 0)"),
          trx.raw("SELECT setval('ingredients_id_seq', 0)"),
          trx.raw("SELECT setval('recipes_id_seq', 0)"),
          trx.raw("SELECT setval('mealplans_id_seq', 0)"),
          trx.raw("SELECT setval('accounts_id_seq', 0)")
        ])
      )
  );
}

/**
 * insert users into db with bcrypted passwords and update sequence
 * @param {knex instance} db
 * @param {array} users - array of user objects for insertion
 * @returns {Promise} - when users table seeded
 */
// function seedUsers(db, users) {
//   const preppedUsers = users.map(user => ({
//     ...user,
//     password: bcrypt.hashSync(user.password, 1)
//   }));
//   return db.transaction(async trx => {
//     await trx.into("accounts").insert(preppedUsers);

//     await trx.raw(
//       "SELECT setval('id_id_seq', ?)",
//       [users[users.length - 1].id],
//     );
//   });
// }

/**
 * seed the databases with words and update sequence counter
 * @param {knex instance} db
 * @param {array} users - array of user objects for insertion
 * @param {array} languages - array of languages objects for insertion
 * @param {array} words - array of words objects for insertion
 * @returns {Promise} - when all tables seeded
 */
async function seedPantry(db, users, ingredients) {
  // await seedUsers(db, users);

  await db.transaction(async trx => {
    await trx.into("accounts").insert(users);
    await trx.into("ingredients").insert(ingredients);

    // await Promise.all([
    //   trx.raw(
    //     "SELECT setval('users_id_seq', ?)",
    //     [users[users.length - 1].id],
    //   ),
    //   trx.raw(
    //     "SELECT setval('ingredients_id_seq', ?)",
    //     [ingredients[ingredients.length - 1].id],
    //   )
    // ]);
  });
}

module.exports = {
  makeKnexInstance,
  makeUsersArray,
  makeRecipe,
  makeIngredients,
  makeAuthHeader,
  cleanTables,
  // seedUsers,
  seedPantry,
};
