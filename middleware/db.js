const path = require("path");
const fs = require("fs")
const Sequelize = require("sequelize");
const mybatisMapper = require("mybatis-mapper");
const envType = process.env.ENV ? process.env.ENV : "dev";

const pemkey = path.join(__dirname, "..", ".", `/key/tokyo-was-hax.pem`);

const tunnel = require('tunnel-ssh');
const config = {
    username: 'ec2-user',
    host: '118.177.20.151',
    port: 22,  //접속할 리눅스ssh포트
    privatekey: fs.readFileSync(pemkey),
    dstHost: 'hexagon.cluster-casly5rdbeuw.ap-northeast-1.rds.amazonaws.com',
    dstPort: 5432,
    srcHost: 'hexagon.cluster-casly5rdbeuw.ap-northeast-1.rds.amazonaws.com',
    srcPort: 5432,
    localHost: '127.0.0.1',
    localPort: 54321
};

const sequelize = new Sequelize('hexagon', 'hax', 'hax13258', {
    host: '127.0.0.1',
    port: 54321,
    dialect: 'postgres'
})

tunnel(config, function (error, server) {    
    if(error) {     
        console.error(error);   
    } else {     
        console.log('server:', server);    
        // test sequelize connection     
        sequelize.authenticate().then(function(err) {
            console.log('connection established');         
        }).catch(function(err) {             
            console.error('unable establish connection', err);         
        })   
    } 
  }) 

  /*


*/
//console.log('server',sequelize);
// const sequelize = new Sequelize("mysql://root:root@127.0.0.1:3306");
// const sequelize = new Sequelize(
//   "postgres://juandlab:juandlab13258@juandlab.cluster-c6hko0mb11bw.ap-northeast-1.rds.amazonaws.com:5432/juandlab"
// );

/*
const dbUrl = process.env.DB_URL;
console.log('dbUrl',dbUrl)
//const sequelize = new Sequelize(dbUrl);
//const sequelize = new Sequelize("postgres://hax:hax13258@hexagon.cluster-casly5rdbeuw.ap-northeast-1.rds.amazonaws.com:5432/hexagon");

const sequelize = new Sequelize('hexagon', 'hax', 'hax13258', {
    host: 'https://hexagon.cluster-casly5rdbeuw.ap-northeast-1.rds.amazonaws.com',
    port: 5432,
    logging: console.log,
    maxConcurrentQueries: 100,
    dialect: 'postgres'
})
*/
const sqlPath = path.join(__dirname, "..", ".", `/sql`);

mybatisMapper.createMapper([`${sqlPath}/sql.xml`, `${sqlPath}/cms.xml`, `${sqlPath}/v1.xml`, `${sqlPath}/scheduler.xml`]);

var db = async function (req, res, next) {
  req.envType = envType;
  req.sequelize = sequelize;
  req.mybatisMapper = mybatisMapper;
  next();
};

module.exports = db;
