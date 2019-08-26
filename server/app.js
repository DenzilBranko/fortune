const express = require('express')
const app = express();
const cors = require('cors')
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const JWT = require('jsonwebtoken')
const {Pool,Client} = require('pg')
const Joi = require('@hapi/joi');
const config = require('./config')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())


let varifyToken = require('./authService')

//DB CONNECTION 
var con = {
    host: 'localhost', 
    port: 5432,
    database: 'db_user_auth',
    user: 'root',
    password: 'root'
};




const pool = new Pool(con)


app.post('/api/save-data',async(req,res) => {
    let { data } = req.body
   
   
    try {
        
         schema = Joi.object().keys({
            email: Joi.string().email().required(),
            phone: Joi.number().required(),//Joi.string().regex(/^\d{3}-\d{3}-\d{4}$/).required(),
            password: Joi.string().required(),
            name: Joi.string().required(),
    
        });

        Joi.validate(data, schema, async(err, value) => {
            if (err) {
               
                res.status(400).send({
                    status: 'error',
                    message: 'Invalid request data',
                    data: data
                });
            } else {
                let qurey1 = `insert into tbl_registration(name,phone,email,password) values($1,$2,$3,$4) returning id `
                const passHash = await bcrypt.hashSync(data.password);
                let queryResult = await pool.query(qurey1,[data.name,data.phone,data.email,passHash]);
                if(queryResult.rows.length>0) {
                    res.status(200).send({message: "ok"})
                } else{
                    res.status(400).send({message: "insertion failed"})
                }
                
            }
    
        });
       
    }catch(err) {
        res.status(500).send({message: "fail"})
    }
})

app.post('/api/login',(req,res) => {
    let { data } = req.body
    schema = Joi.object().keys({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        });
        try {
            Joi.validate(data, schema, async(err, value) => {
                if (err) {
                    res.status(422).json({
                        status: 'error',
                        message: 'Invalid request data',
                        data: data
                    });
                } else {
                    let loginQuery = `select email,password from tbl_registration where email=$1`
                    let loginRes = await pool.query(loginQuery,[data.email])
                    if(loginRes.rows.length>0) {
                        let email = loginRes.rows[0].emaill
                        let pass = loginRes.rows[0].password
                        let passComp = bcrypt.compareSync(data.password, pass);
                        if(passComp) {
                            var token = JWT.sign({ id: email }, config.secret, {
                                expiresIn: 86400 // expires in 24 hours
                            });
                            if(!token) {
                                res.status(403).send({ auth: false, token: null }); 
                            }
                            res.status(200).send({ auth: true, token: token });
                        } else {
                            res.status(400).send({ message: "no valid password"})
                        }
                    } else {
                        res.status(400).send({message: "no record found"})
                    }
                 }
        
            });
    
        } catch(err) {
            res.status(200).send({message: "error"})
        }
       

    
})

module.exports = app

