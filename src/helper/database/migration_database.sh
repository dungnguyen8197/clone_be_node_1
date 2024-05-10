cd src/helper/database

node ./init_database.js

npx sequelize init

rm config/config.json

cp config/example.config.js config/config.js

npx sequelize-cli db:migrate

rm config/config.js

rm -rf models

rm -rf seeders