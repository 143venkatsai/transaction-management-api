const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Sequelize, DataTypes} = require('sequelize');

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
});

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

const User = sequelize.define("User", {
    name: { type: DataTypes.STRING, allowNull: false },
});

const Transaction = sequelize.define("Transaction", {
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    transaction_type: {
        type: DataTypes.ENUM('DEPOSIT', 'WITHDRAWAL'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        allowNull: false
    },
    timestamp: {type: DataTypes.DATE, defaultValue: Sequelize.NOW}
});

Transaction.belongsTo(User, {foreignKey: "userId"});
User.hasMany(Transaction, {foreignKey: "userId"});

sequelize.sync({force: true})
.then(() => console.log("Database Synced."))
.catch((err) => console.log(err));

//  Create Transactions 

app.post("/api/transactions", async(req, res) =>{
    const {amount,status, transaction_type, user} = req.body;
    try{
        const transaction = await Transaction.create({
            amount,
            transaction_type,
            status,
            userId: user
        });
        res.status(201).json(transaction);
    }catch(err){
        res.status(400).json({message: err.message});
    }
});

//  Get Transactions 

app.get("/api/transactions", async(req, res) =>{
    const {userId} = req.query;
    try{
        const transactions = await Transaction.findAll();
        res.json(transactions);
    }catch(err){
        res.status(400).json({message: err.message});
    }
});

//  Update Transaction 

app.put("/api/transactions/:transaction_id", async(req, res) =>{
    const {transaction_id} = req.params;
    const {status} = req.body;

    try{
        const transaction = await Transaction.findByPk(transaction_id);
        if(!transaction){
            return res.status(404).json({message: "Transaction not found."});
        }

        if(!["COMPLETED, FAILED"].includes(status)){
            return res.status(400).json({message: "Invalid status."});
        }

        transaction.status = status;
        await transaction.save();
        res.json(transaction);
    }catch(err){
        res.status(400).json({message: err.message});
    }
});

//  Get Transaction By Id

app.get("/api/transactions/:transaction_id", async(req, res) =>{
    const {transaction_id} = req.params;
    try{
        const transaction = await Transaction.findByPk(transaction_id);
        if(!transaction){
            return res.status(404).json({message: "Transaction not found."});
        }
    }catch(err){
        res.status(400).json({message: err.message});
    }
});

