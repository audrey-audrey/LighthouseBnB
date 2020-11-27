SELECT properties.id, properties.title, properties.cost_per_night, avg(property_reviews.rating) as average_rating
FROM properties
JOIN property_reviews ON properties.id = property_id
WHERE city LIKE '%ancouv%'
AND cost_per_night > 10000
AND cost_per_night < 50000
GROUP BY properties.id
-- HAVING avg(property_reviews.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;
