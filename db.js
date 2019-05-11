const pg = require("pg");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL
});
client.connect();

const db = {
  insertLabel: function(label, cb) {
    let query = `INSERT INTO waymo_spice_labels (image_url, food_label, spicy_label) VALUES ('${
      label.image_url
    }', ${label.food_label}, ${label.spicy_label}) RETURNING *`;
    console.log(query);

    client.query(query, (err, result) => {
      if (err) {
        cb({ err: err });
      } else {
        cb(result.rows[0]);
      }
    });
  },
  selectLabel: function(cb) {
    let query = `SELECT image_url FROM waymo_spice_labels`;
    console.log(query);

    client.query(query, (err, result) => {
      if (err) cb({ err: err });
      cb(result.rows);
    });
  }
};

module.exports = db;
