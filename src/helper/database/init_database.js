require('dotenv').config({path: __dirname + '/./../../../.env'})
const path = require('path')
const fs = require('fs')

;(async function () {
  const {Sequelize, DataTypes} = require('sequelize')
  const sequelize = new Sequelize(
    process.env.mysql_database,
    process.env.mysql_user,
    process.env.mysql_password,
    {
      host: process.env.mysql_host,
      port: process.env.mysql_port || 3306,
      dialect: 'mysql',
      timezone: '+07:00',
      logging: false
    }
  )

  const modelFiles = path.join(__dirname, '../../db/models')
  fs.readdirSync(modelFiles)
    .filter((name) => name.toLowerCase().endsWith('.model.js'))
    .map((name) => name.replace('.js', ''))
    .forEach(async (name) => {
      const model = require(`../../db/models/${name}`)
      await model(sequelize, DataTypes).sync({alter: true, force: true})
      console.log(`SYNC: src/db/models/${name}.js -> ${name.replace('.model', '')}`)
    })

  setTimeout(() => {
    process.exit(1)
  }, 2000)
})()
