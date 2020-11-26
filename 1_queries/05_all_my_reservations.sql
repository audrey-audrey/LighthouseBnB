SELECT reservations.*, properties.*, avg(rating) as average_rating
FROM users 
JOIN reservations ON users.id = reservations.guest_id
JOIN properties ON users.id = properties.owner_id
JOIN property_reviews ON users.id = property_reviews.guest_id
WHERE users.id = 1 
AND reservations.end_date < now()::date
GROUP BY reservations.id, properties.id
ORDER BY start_date
LIMIT 10;