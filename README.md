# !woofbot

an interactive stream chatbot by [slugbubby](https://twitch.tv/slugbubby)

## features

- woofbot
  - !woof in twitch chat triggers a dog bark
  - chatters can set their dog with !dog
- spybot chatter management system / extortion sim

### TODO

- deploy to railway; postgres, env, migrations on deploy, NODE_ENV=production, secret token in overlay URL, point obs to live url
- spybot
  - track chatters, log chat messages

## tech stack

- hono server
- postgres db
- drizzle orm
- railway hosting
