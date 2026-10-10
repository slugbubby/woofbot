# !woofbot

an interactive stream chatbot by [slugbubby](https://twitch.tv/slugbubby)

## features

- woofbot
  - twitch !woof command triggers dog bark [in progress]
  - chatters can set their dog (thusly, their bark)
- spybot chatter management system / extortion sim

### TODO

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
