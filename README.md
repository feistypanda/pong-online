# PONG ONLINE
#### Video Demo: https://drive.google.com/file/d/1rdCRLdoGjE2hieyJUH2sGTtmNmwDrqA2/view?usp=sharing
#### Description:

##### Product

###### Overview
Pong online is a web app that allowes users to play multiplayer pong against eachother. Pong online is powered by nodejs and expressjs.

###### Accounts
Pong online allows users to create and log into accounts. Accounts are stored as documents in a mongoDB database, and each account has a \_id, a username, a hashed password, and a elo value. Once users log into the website, javascript web tokens (jwts) are sent to the client in the form of cookies and json values. The server sends both an access token, used for accesing the website, and a refresh token, used for obtaining a new access token when the current one expires. The use of jwts with access tokens and refresh tokens allows for a secure and reliable way of keeping the user logged in.

Passwords are hashed with bcrypt, which comes with built in support for salting (which I used)

###### Game
Pong online uses a websocket server in addition to the expressjs server to allow realtime gameplay between users. When a user queues into a game, the websocket server first validates the access token and then adds the client to a game. If all of the games in the servers array of games are full, the server creates a new game. If the user tries to join multiple games on the same account, the server will reject the request and the user will see an error message informing them that they cannot do that. Once the game is over, the server calculates the new elos of both players according to Arpad Elo's system ([wikipedia](https://en.wikipedia.org/wiki/Elo_rating_system)). Then the clients are sent a message with the game summary and the websocket connections are closed.

###### Files

* config/env.mjs
  * contains json data and references to process.env
  * handles config information such as token secrets, database uri, and token expirations

* controllers/authController.mjs
  * contains several exported functions
  * handles logging in, logging out, and use of refresh tokens. 

* db/db.mjs
  * contains innitialization of mongoclient and some functions
  * simplifies connecting to and querying from the database

* middleware/auth.mjs
  * contains a middleware function that prevents requests that do not have valid access tokens
  * prevents and redirects logged out users as well as atatching user data to the request object

* utils/elo.mjs
  * exports a function
  * calculates the elo change after a match

* utils/passwordUtils.mjs
  * exports several functions
  * simplifies using bcrypt for password hashing and verification

* utils/tokenUtils.mjs
  * exports several functions
  * wraps jwt functions in promises as well as simplifying their use

* wss/game.mjs
  * exports a Game constructor
  * handles all things relating to a game: players, paddle, ect. Also sends game data to the users

* wss/server.mjs
  * exports a websocket server
  * handles connecting clients and putting them into games

* /app.mjs
  * main file
  * puts everything together

##### Process

I originally intendet to use sessions instead of JWTs, but I ended up deciding on JWTs because they used less server storage and are the more modern solution to this problem. Although after first implementing JWTs (I had only used access tokens, not refresh tokens), I realized that there was no good way to log a user out because if they had kept their token, they could manually send it to the server and be logged in. To solve this issue, I had to add refresh tokens, which are fully removed from the system when the user logs out, meaning that if the user logs out, they could only log in again with a old token for 15 minutes because that is how long the access token's expiration is

I also started making the app with only static html files, but then I realized that that would be problematic, especailly for the leaderboard page, so I switched to ejs, which is a javscript templating library, similar to jinja

Finally, I went through many revisions for the game itself and the results screen. Firstly, I started by making the results on the same page as the actual game, but then I decided that it would be much simpler and easier (especially for making a play again button) if I made the results on a seperate page. In addition to this, I revised the mechanics of the game in regards to the ball physics several times, eventually settling on making the ball bounce in a random direction within the same quadrant that it would have bounced in if bounces were fully deterministic. This greatly increased the skill involved in the game, because it was too easy previously.