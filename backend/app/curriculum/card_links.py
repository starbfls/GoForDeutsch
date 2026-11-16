"""Reviewed vocabulary associated with each exercise and guessing step."""
MISSION_CARDS = {
    "bakery-first": ["bakery-1", "bakery-4", "bakery-5", "bakery-6"],
    "bakery-picnic": ["bakery-1", "bakery-2", "bakery-5", "bakery-6"],
    "bakery-review": ["bakery-1", "bakery-2", "park-water", "bakery-6"],
    "park-discover": ["park-tree", "park-flower", "park-bench"],
    "park-picnic": ["park-ball", "park-water", "school-bag"],
    "park-finale": ["park-sun", "park-play", "park-blue"],
    "school-hello": ["school-greeting", "school-name", "school-age"],
    "school-bag": ["school-pencil", "school-pen", "school-book", "school-bag"],
    "school-day": ["school-monday", "school-german", "school-football"],
}
GUESS_CARDS = {
    ("park-discover", "tree"): "park-tree",
    ("park-discover", "red-ball"): "park-flower",
    ("park-discover", "blue-ball"): "park-bench",
    ("park-picnic", "under-bench"): "park-ball",
    ("park-picnic", "water"): "park-water",
    ("park-picnic", "play-football"): "school-bag",
    ("park-finale", "sunny"): "park-sun",
    ("park-finale", "go-park"): "park-play",
    ("park-finale", "in-park"): "park-blue",
}

MISSION_CARDS.update({
 "clothing-labels":["clothes-blouse","clothes-pink","clothes-size"],
 "clothing-fitting":["clothes-jacket","clothes-size","clothes-right","park-blue"],
 "clothing-checkout":["clothes-blouse","clothes-skirt","clothes-pink","park-blue"],
 "electronics-devices":["tech-phone","tech-headphones","tech-laptop"],
 "electronics-desk":["tech-keyboard","tech-mouse","tech-screen"],
 "electronics-accessories":["tech-camera","tech-cable","tech-speaker"],
 "restaurant-order":["food-menu","food-pizza","park-water"],
 "restaurant-requests":["food-table","bakery-6","food-meat","food-bill","food-pay"],
 "restaurant-conversation":["food-table","food-pizza","food-meat","park-water","food-bill"]
})
GUESS_CARDS.update({
 ("electronics-devices","phone"):"tech-phone",("electronics-devices","headphones"):"tech-headphones",("electronics-devices","laptop"):"tech-laptop",
 ("electronics-desk","keyboard"):"tech-keyboard",("electronics-desk","mouse"):"tech-mouse",("electronics-desk","screen"):"tech-screen",
 ("electronics-accessories","camera"):"tech-camera",("electronics-accessories","cable"):"tech-cable",("electronics-accessories","speaker"):"tech-speaker"
})
