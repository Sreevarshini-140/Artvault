# ArtVault REST API

Base URL: `http://localhost:5000/api`

## Authentication
- `POST /auth/register` — `{name,email,password,role}`
- `POST /auth/login` — returns access and refresh JWTs
- `POST /auth/refresh` — requires refresh token

Send protected requests with `Authorization: Bearer <access_token>`.

## Artworks
- `GET /artworks?search=&category=&page=1&per_page=12`
- `GET /artworks/{id}`
- `POST /artworks` — artist/admin
- `PUT /artworks/{id}` — owner/admin
- `DELETE /artworks/{id}` — owner/admin
- `POST /artworks/{id}/reviews` — authenticated user

## Users
- `GET /users/me`
- `GET /users/wishlist`
- `POST /users/wishlist/{artwork_id}`
- `DELETE /users/wishlist/{artwork_id}`
- `POST /users/follow/{artist_id}`

## Exhibitions
- `GET /exhibitions`
- `GET /exhibitions/{slug}`
- `POST /exhibitions` — curator/admin

## Orders
- `GET /orders`
- `POST /orders`

Example order body:
```json
{"shipping_address":"Visakhapatnam, Andhra Pradesh","items":[{"artwork_id":1,"product_type":"canvas","quantity":1}]}
```

## Dashboards
- `GET /dashboard/admin` — admin only
- `GET /dashboard/artist` — artist/admin

## Error format
```json
{"error":"Readable error message"}
```
