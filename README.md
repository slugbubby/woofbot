# woof!bot

an interactive stream chatbot by [slugbubby](https://twitch.tv/slugbubby)

## planned features

- woofbot
  - twitch !woof command triggers dog bark
  - chatters can choose a dog on website
- voyeurbot (chatter management system / extortion sim)

## TODO

- add twitch chat integration to bark on !woof
  - register app in twitch dev console, get oauth tokens
  - set up twurple, make "!woof" call emitOverlayEvent
  - store refresh tokens in db since railway has no persistent local files
  - basic spam protection: cooldown on !woof
- add more dog barks
- support choosing a woof
- deploy to railway; postgres, env, migrations on deploy, NODE_ENV=production, secret token in overlay URL, point obs to live url
- spybot
  - track chatters, log chat messages

## tech stack

- hono server
- postgres db
- drizzle orm
- railway hosting
