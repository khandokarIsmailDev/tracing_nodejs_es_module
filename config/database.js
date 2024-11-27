import { Sequelize } from "sequelize";

const sequelize = new Sequelize('my_db','my_user','my_password',{
    host: 'localhost',
    dialect: 'mysql'
})

export default sequelize;