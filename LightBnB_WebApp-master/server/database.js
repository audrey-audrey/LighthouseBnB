const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString = `
  SELECT *
  FROM users
  WHERE email = $1;
  `;
  const input = email.toLocaleLowerCase();
  const values = [input];

  return pool.query(queryString, values)
    .then(res => res.rows[0] ? res.rows[0] : null)
    .catch(err => console.log(err));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString = `
  SELECT *
  FROM users
  WHERE id = $1;
  `;
  const values = [id];

  return pool.query(queryString, values)
    .then(res => res.rows[0] ? res.rows[0] : null)
    .catch(err => console.log(err));
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {

  const queryString = `
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;
  `;
  const name = user.name;
  const email = user.email;
  const password = user.password;

  const values = [name, email, password];

  return pool.query(queryString, values)
    .then(res => console.log(res.rows[0]))
    .catch(err => console.log(err));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const queryString = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM users 
  JOIN reservations ON users.id = reservations.guest_id
  JOIN properties ON users.id = properties.owner_id
  JOIN property_reviews ON users.id = property_reviews.guest_id
  WHERE users.id = $1 
  AND reservations.end_date < now()::date
  GROUP BY reservations.id, properties.id
  ORDER BY start_date
  LIMIT $2;`;

  const values = [guest_id, limit];

  return pool.query(queryString, values)
    .then(res => res.rows)
    .catch(err => console.log(err));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing queryString options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `${queryParams.length > 1 ? 'AND' : 'WHERE'} city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    queryString += `${queryParams.length > 1 ? 'AND' : 'WHERE '} owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    queryString += `${queryParams.length > 1 ? 'AND' : 'WHERE'} cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += `${queryParams.length > 1 ? 'AND' : 'WHERE'} cost_per_night <= $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `
    GROUP BY properties.id
    HAVING avg(property_reviews.rating) >= $${queryParams.length} 
    `;
  } else {
    queryString += `
    GROUP BY properties.id
    `;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  return pool.query(queryString, queryParams)
    .then(res => res.rows)
    .catch(err => console.log(err));
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryString = `
INSERT INTO properties (
  title, 
  description, 
  number_of_bedrooms, 
  number_of_bathrooms, 
  parking_spaces, 
  cost_per_night, 
  thumbnail_photo_url, 
  cover_photo_url, 
  street, 
  country, 
  city, 
  province, 
  post_code, 
  owner_id
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
RETURNING *;
`;
  const values = Object.values(property);

  return pool.query(queryString, values)
    .then(res => res.rows)
    .catch(err => console.log(err));
};
exports.addProperty = addProperty;
